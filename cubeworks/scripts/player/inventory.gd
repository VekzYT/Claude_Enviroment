class_name Inventory
extends RefCounted
## A 36 slot block inventory: the first nine slots are the hotbar.
##
## A slot is a plain dictionary { "id": block id, "count": how many }. An empty
## slot is id 0 / count 0. All the UI does is read and rearrange these.

signal changed
signal selection_changed(index: int)

const HOTBAR_SIZE := 9
const ROWS := 3
const COLUMNS := 9
const SIZE := HOTBAR_SIZE + ROWS * COLUMNS   # 36
const MAX_STACK := 64

var slots: Array = []
var selected: int = 0


func _init() -> void:
	slots.resize(SIZE)
	for i in SIZE:
		slots[i] = {"id": 0, "count": 0}


func is_empty_slot(i: int) -> bool:
	return slots[i]["count"] <= 0 or slots[i]["id"] == 0


func slot_id(i: int) -> int:
	return 0 if is_empty_slot(i) else int(slots[i]["id"])


func slot_count(i: int) -> int:
	return 0 if is_empty_slot(i) else int(slots[i]["count"])


func clear_slot(i: int) -> void:
	slots[i] = {"id": 0, "count": 0}


func selected_id() -> int:
	return slot_id(selected)


func select(index: int) -> void:
	var i := wrapi(index, 0, HOTBAR_SIZE)
	if i == selected:
		return
	selected = i
	selection_changed.emit(selected)
	changed.emit()


func scroll_selection(delta: int) -> void:
	select(wrapi(selected + delta, 0, HOTBAR_SIZE))


## Adds blocks, filling part-used stacks first. Returns what would not fit.
func add(id: int, count: int) -> int:
	if id <= 0 or count <= 0:
		return 0
	var left := count

	for i in SIZE:
		if left <= 0:
			break
		if slot_id(i) == id and slot_count(i) < MAX_STACK:
			var space: int = MAX_STACK - slot_count(i)
			var moved: int = mini(space, left)
			slots[i]["count"] = slot_count(i) + moved
			left -= moved

	for i in SIZE:
		if left <= 0:
			break
		if is_empty_slot(i):
			var moved2: int = mini(MAX_STACK, left)
			slots[i] = {"id": id, "count": moved2}
			left -= moved2

	if left != count:
		changed.emit()
	return left


func count_of(id: int) -> int:
	var total := 0
	for i in SIZE:
		if slot_id(i) == id:
			total += slot_count(i)
	return total


## Removes up to `count` of a block from anywhere. Returns how many were taken.
func take(id: int, count: int) -> int:
	var taken := 0
	for i in SIZE:
		if taken >= count:
			break
		if slot_id(i) != id:
			continue
		var moved: int = mini(slot_count(i), count - taken)
		slots[i]["count"] = slot_count(i) - moved
		if slot_count(i) <= 0:
			clear_slot(i)
		taken += moved
	if taken > 0:
		changed.emit()
	return taken


## Takes one block out of the selected hotbar slot, for placing.
func consume_selected(amount: int = 1) -> bool:
	if is_empty_slot(selected) or slot_count(selected) < amount:
		return false
	slots[selected]["count"] = slot_count(selected) - amount
	if slot_count(selected) <= 0:
		clear_slot(selected)
	changed.emit()
	return true


## Drops the whole selected stack (or one block) out of the inventory.
func drop_selected(whole_stack: bool) -> Dictionary:
	if is_empty_slot(selected):
		return {"id": 0, "count": 0}
	var id := slot_id(selected)
	var amount: int = slot_count(selected) if whole_stack else 1
	slots[selected]["count"] = slot_count(selected) - amount
	if slot_count(selected) <= 0:
		clear_slot(selected)
	changed.emit()
	return {"id": id, "count": amount}


## Swaps two slots, merging them instead when they hold the same block.
func swap(a: int, b: int) -> void:
	if a == b or a < 0 or b < 0 or a >= SIZE or b >= SIZE:
		return
	if slot_id(a) != 0 and slot_id(a) == slot_id(b):
		var space: int = MAX_STACK - slot_count(b)
		var moved: int = mini(space, slot_count(a))
		if moved > 0:
			slots[b]["count"] = slot_count(b) + moved
			slots[a]["count"] = slot_count(a) - moved
			if slot_count(a) <= 0:
				clear_slot(a)
			changed.emit()
			return
	var tmp = slots[a]
	slots[a] = slots[b]
	slots[b] = tmp
	changed.emit()


## Moves half of a stack into an empty slot, the usual right-click split.
func split_into(from: int, to: int) -> void:
	if from == to or is_empty_slot(from) or not is_empty_slot(to):
		return
	var half: int = maxi(1, slot_count(from) / 2)
	slots[to] = {"id": slot_id(from), "count": half}
	slots[from]["count"] = slot_count(from) - half
	if slot_count(from) <= 0:
		clear_slot(from)
	changed.emit()


## Shift-click behaviour: hotbar <-> backpack.
func quick_move(index: int) -> void:
	if is_empty_slot(index):
		return
	var id := slot_id(index)
	var count := slot_count(index)
	var from_hotbar := index < HOTBAR_SIZE
	var lo := HOTBAR_SIZE if from_hotbar else 0
	var hi := SIZE if from_hotbar else HOTBAR_SIZE

	var left := count
	for i in range(lo, hi):
		if left <= 0:
			break
		if slot_id(i) == id and slot_count(i) < MAX_STACK:
			var moved: int = mini(MAX_STACK - slot_count(i), left)
			slots[i]["count"] = slot_count(i) + moved
			left -= moved
	for i in range(lo, hi):
		if left <= 0:
			break
		if is_empty_slot(i):
			var moved2: int = mini(MAX_STACK, left)
			slots[i] = {"id": id, "count": moved2}
			left -= moved2

	if left == count:
		return
	slots[index]["count"] = left
	if left <= 0:
		clear_slot(index)
	changed.emit()


## Lets the inventory screen announce edits it made to `slots` directly.
func notify_changed() -> void:
	changed.emit()


func clear() -> void:
	for i in SIZE:
		clear_slot(i)
	changed.emit()


# ------------------------------------------------------------ persistence

func to_data() -> Array:
	var out: Array = []
	for i in SIZE:
		out.append([slot_id(i), slot_count(i)])
	return out


func from_data(data: Array) -> void:
	for i in SIZE:
		if i < data.size() and data[i] is Array and data[i].size() >= 2:
			var id := int(data[i][0])
			var count := int(data[i][1])
			if id > 0 and count > 0:
				slots[i] = {"id": id, "count": clampi(count, 1, MAX_STACK)}
				continue
		clear_slot(i)
	changed.emit()


## The kit a brand new player starts with, so building is possible immediately.
func give_starter_kit() -> void:
	add(BlockDB.PLANKS, 32)
	add(BlockDB.WORKBENCH, 1)
	add(BlockDB.GLASS, 16)
	add(BlockDB.LAMP, 8)
	changed.emit()
