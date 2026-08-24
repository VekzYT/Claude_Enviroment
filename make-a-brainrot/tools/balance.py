PRICE = dict(wood=25, rope=60, scale=200, bat=600, steel=2000, eye=9000,
             bell=45000, shard=260000, core=1500000, crown=8500000)

# Hand-written so each recipe reads like the thing it makes. Tung Tung Sahur is
# exactly the recipe from the design chat: 5 wood and 1 baseball bat.
BR = [
 ("tung","Tung Tung Sahur","Common",20,          dict(wood=5, bat=1)),
 ("tralalero","Tralalero Tralala","Uncommon",65, dict(scale=12, rope=8, bat=5)),
 ("patapim","Brr Brr Patapim","Rare",210,        dict(steel=15, scale=20, bat=12, wood=30)),
 ("bombardiro","Bombardiro Crocodilo","Epic",700,dict(eye=28, steel=20, bat=15)),
 ("lirili","Lirili Larila","Legendary",2300,     dict(bell=35, eye=30, steel=25)),
 ("chimpanzini","Chimpanzini Bananini","Mythic",7500, dict(shard=38, bell=20, eye=12)),
 ("bombombini","Bombombini Gusini","Divine",25000,    dict(core=32, shard=35, bell=15)),
 ("combinasion","Sahur Combinasion","Secret",82000,   dict(crown=30, core=15, shard=6)),
 ("vacca","La Vacca Saturno Saturnita","BrainrotGod",270000, dict(crown=145, core=40, shard=10)),
]
cost = lambda r: sum(PRICE[m]*n for m, n in r.items())

print(f"{'brainrot':28}{'cost':>17}{'inc/s':>10}{'payback':>9}")
prev=None
for _i,name,_r,inc,rec in BR:
    c=cost(rec); print(f"{name:28}{c:>17,}{inc:>10,}{c/inc:>8.0f}s")
    assert prev is None or c>prev; prev=c

BASE, PER, MAXS = 6, 2, 20
slots_for = lambda r: min(BASE+PER*r, MAXS)
mult_for  = lambda r: 1+0.20*r

def sim(rb_base, rb_growth, hours=80):
    rc = lambda r: int(rb_base * rb_growth**r)
    cash, reb, placed, marks, seen = 1000, 0, [], [], set()
    for t in range(1, 3600*hours):
        cash += int(sum(BR[i][3] for i in placed)*mult_for(reb))
        if slots_for(reb) < MAXS and cash >= rc(reb):
            cash -= rc(reb); reb += 1
            marks.append((t, f"rebirth {reb} -> {slots_for(reb)} slots, {mult_for(reb):.1f}x")); continue
        best=None
        for i,(_a,_b,_c,inc,rec) in enumerate(BR):
            if cost(rec)<=cash and (best is None or inc>BR[best][3]): best=i
        if best is None: continue
        s=slots_for(reb)
        if len(placed)<s: cash-=cost(BR[best][4]); placed.append(best)
        elif BR[best][3] > BR[min(placed,key=lambda i:BR[i][3])][3]:
            w=min(range(len(placed)),key=lambda k:BR[placed[k]][3])
            cash-=cost(BR[best][4]); placed[w]=best
        else: continue
        if best not in seen: seen.add(best); marks.append((t,f"first {BR[best][1]}"))
    done = reb>=7 and len(seen)==9
    return marks, reb, len(seen), done

for base, growth in [(50000,4.5),(120000,5.0),(250000,5.5),(400000,6.0)]:
    marks, reb, tiers, done = sim(base, growth)
    last = marks[-1][0] if marks else 0
    print(f"\nrebirth base ${base:,} growth {growth}x  ->  rebirth {reb}, {tiers}/9 tiers, "
          f"last milestone {last//3600}h{(last%3600)//60:02d}m, maxed={done}")

print("\n--- chosen curve in detail ---")
marks,_,_,_ = sim(250000, 5.5)
for t,w in marks:
    print(f"  {t//3600:>2}h {(t%3600)//60:02d}m   {w}")
