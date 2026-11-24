"use strict";(()=>{var mm=0,gd=1,gm=2;var Rr=1,xm=2,Ro=3,ir=0,Gn=1,Vn=2,is=0,Co=1,ka=2,xd=3,bd=4,bm=5;var Cr=100,ym=101,vm=102,_m=103,Mm=104,wm=200,Sm=201,Tm=202,Em=203,yd=204,vd=205,Am=206,Rm=207,Cm=208,Pm=209,Im=210,Lm=211,Dm=212,km=213,Nm=214,sc=0,rc=1,oc=2,yo=3,ac=4,lc=5,cc=6,uc=7,Na=0,Um=1,Om=2,Oi=0,_d=1,Md=2,wd=3,Sd=4,Td=5,Ed=6,Ua=7;var Ad=300,sr=301,Pr=302,Nc=303,Uc=304,Oa=306,hc=1e3,Kn=1001,dc=1002,Kt=1003,Fm=1004;var Fa=1005;var qt=1006,Oc=1007;var Mi=1008;var ei=1009,Rd=1010,Cd=1011,Po=1012,Fc=1013,Fi=1014,wi=1015,Bi=1016,Bc=1017,zc=1018,Io=1020,Pd=35902,Id=35899,Ld=1021,Dd=1022,Ln=1023,ji=1026,rr=1027,Hc=1028,Gc=1029,or=1030,Vc=1031;var Wc=1033,Ba=33776,za=33777,Ha=33778,Ga=33779,Xc=35840,Yc=35841,qc=35842,$c=35843,Zc=36196,Kc=37492,Jc=37496,jc=37488,Qc=37489,Va=37490,eu=37491,tu=37808,nu=37809,iu=37810,su=37811,ru=37812,ou=37813,au=37814,lu=37815,cu=37816,uu=37817,hu=37818,du=37819,fu=37820,pu=37821,mu=36492,gu=36494,xu=36495,bu=36283,yu=36284,Wa=36285,vu=36286;var ga=2300,fc=2301,nc=2302,ld=2303,cd=2400,ud=2401,hd=2402;var Bm=3200;var Xa=0,zm=1,Ss="",Wt="srgb",xa="srgb-linear",ba="linear",Lt="srgb";var ic=7680;var Hm=519,Gm=512,Vm=513,Wm=514,_u=515,Xm=516,Ym=517,Mu=518,qm=519,$m=35044,Si=35048;var kd="300 es",Ni=2e3,vo=2001;function E1(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function A1(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function ya(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Zm(){let n=ya("canvas");return n.style.display="block",n}var Vp={},_o=null;function Nd(...n){let e="THREE."+n.shift();_o?_o("log",e,...n):console.log(e,...n)}function Km(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function et(...n){n=Km(n);let e="THREE."+n.shift();if(_o)_o("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function tt(...n){n=Km(n);let e="THREE."+n.shift();if(_o)_o("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Ar(...n){let e=n.join(" ");e in Vp||(Vp[e]=!0,et(...n))}function Jm(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}var jm={[sc]:rc,[oc]:cc,[ac]:uc,[yo]:lc,[rc]:sc,[cc]:oc,[uc]:ac,[lc]:yo},Qi=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Rn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Wp=1234567,pa=Math.PI/180,Mo=180/Math.PI;function Lo(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Rn[n&255]+Rn[n>>8&255]+Rn[n>>16&255]+Rn[n>>24&255]+"-"+Rn[e&255]+Rn[e>>8&255]+"-"+Rn[e>>16&15|64]+Rn[e>>24&255]+"-"+Rn[t&63|128]+Rn[t>>8&255]+"-"+Rn[t>>16&255]+Rn[t>>24&255]+Rn[i&255]+Rn[i>>8&255]+Rn[i>>16&255]+Rn[i>>24&255]).toLowerCase()}function yt(n,e,t){return Math.max(e,Math.min(t,n))}function Ud(n,e){return(n%e+e)%e}function R1(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function C1(n,e,t){return n!==e?(t-n)/(e-n):0}function ma(n,e,t){return(1-t)*n+t*e}function P1(n,e,t,i){return ma(n,e,1-Math.exp(-t*i))}function I1(n,e=1){return e-Math.abs(Ud(n,e*2)-e)}function L1(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function D1(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function k1(n,e){return n+Math.floor(Math.random()*(e-n+1))}function N1(n,e){return n+Math.random()*(e-n)}function U1(n){return n*(.5-Math.random())}function O1(n){n!==void 0&&(Wp=n);let e=Wp+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function F1(n){return n*pa}function B1(n){return n*Mo}function z1(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function H1(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function G1(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function V1(n,e,t,i,s){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+i)/2),u=o((e+i)/2),d=r((e-i)/2),h=o((e-i)/2),f=r((i-e)/2),p=o((i-e)/2);switch(s){case"XYX":n.set(a*u,l*d,l*h,a*c);break;case"YZY":n.set(l*h,a*u,l*d,a*c);break;case"ZXZ":n.set(l*d,l*h,a*u,a*c);break;case"XZX":n.set(a*u,l*p,l*f,a*c);break;case"YXY":n.set(l*f,a*u,l*p,a*c);break;case"ZYZ":n.set(l*p,l*f,a*u,a*c);break;default:et("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function xo(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Bn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var wu={DEG2RAD:pa,RAD2DEG:Mo,generateUUID:Lo,clamp:yt,euclideanModulo:Ud,mapLinear:R1,inverseLerp:C1,lerp:ma,damp:P1,pingpong:I1,smoothstep:L1,smootherstep:D1,randInt:k1,randFloat:N1,randFloatSpread:U1,seededRandom:O1,degToRad:F1,radToDeg:B1,isPowerOfTwo:z1,ceilPowerOfTwo:H1,floorPowerOfTwo:G1,setQuaternionFromProperEuler:V1,normalize:Bn,denormalize:xo},Hd=class Hd{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=yt(this.x,e.x,t.x),this.y=yt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=yt(this.x,e,t),this.y=yt(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(yt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(yt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Hd.prototype.isVector2=!0;var ft=Hd,es=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],u=i[s+2],d=i[s+3],h=r[o+0],f=r[o+1],p=r[o+2],x=r[o+3];if(d!==x||l!==h||c!==f||u!==p){let g=l*h+c*f+u*p+d*x;g<0&&(h=-h,f=-f,p=-p,x=-x,g=-g);let m=1-a;if(g<.9995){let b=Math.acos(g),w=Math.sin(b);m=Math.sin(m*b)/w,a=Math.sin(a*b)/w,l=l*m+h*a,c=c*m+f*a,u=u*m+p*a,d=d*m+x*a}else{l=l*m+h*a,c=c*m+f*a,u=u*m+p*a,d=d*m+x*a;let b=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=b,c*=b,u*=b,d*=b}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],u=i[s+3],d=r[o],h=r[o+1],f=r[o+2],p=r[o+3];return e[t]=a*p+u*d+l*f-c*h,e[t+1]=l*p+u*h+c*d-a*f,e[t+2]=c*p+u*f+a*h-l*d,e[t+3]=u*p-a*d-l*h-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(s/2),d=a(r/2),h=l(i/2),f=l(s/2),p=l(r/2);switch(o){case"XYZ":this._x=h*u*d+c*f*p,this._y=c*f*d-h*u*p,this._z=c*u*p+h*f*d,this._w=c*u*d-h*f*p;break;case"YXZ":this._x=h*u*d+c*f*p,this._y=c*f*d-h*u*p,this._z=c*u*p-h*f*d,this._w=c*u*d+h*f*p;break;case"ZXY":this._x=h*u*d-c*f*p,this._y=c*f*d+h*u*p,this._z=c*u*p+h*f*d,this._w=c*u*d-h*f*p;break;case"ZYX":this._x=h*u*d-c*f*p,this._y=c*f*d+h*u*p,this._z=c*u*p-h*f*d,this._w=c*u*d+h*f*p;break;case"YZX":this._x=h*u*d+c*f*p,this._y=c*f*d+h*u*p,this._z=c*u*p-h*f*d,this._w=c*u*d-h*f*p;break;case"XZY":this._x=h*u*d-c*f*p,this._y=c*f*d-h*u*p,this._z=c*u*p+h*f*d,this._w=c*u*d+h*f*p;break;default:et("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],d=t[10],h=i+a+d;if(h>0){let f=.5/Math.sqrt(h+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(i>a&&i>d){let f=2*Math.sqrt(1+i-a-d);this._w=(u-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>d){let f=2*Math.sqrt(1+a-i-d);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+u)/f}else{let f=2*Math.sqrt(1+d-i-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(yt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-i*c,this._z=r*u+o*c+i*l-s*a,this._w=o*u-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,s=-s,r=-r,o=-o,a=-a);let l=1-t;if(a<.9995){let c=Math.acos(a),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Gd=class Gd{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Xp.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Xp.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),u=2*(a*t-r*s),d=2*(r*i-o*t);return this.x=t+l*c+o*d-a*u,this.y=i+l*u+a*c-r*d,this.z=s+l*d+r*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=yt(this.x,e.x,t.x),this.y=yt(this.y,e.y,t.y),this.z=yt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=yt(this.x,e,t),this.y=yt(this.y,e,t),this.z=yt(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(yt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Hh.copy(this).projectOnVector(e),this.sub(Hh)}reflect(e){return this.sub(Hh.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(yt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Gd.prototype.isVector3=!0;var Z=Gd,Hh=new Z,Xp=new es,Vd=class Vd{constructor(e,t,i,s,r,o,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let u=this.elements;return u[0]=e,u[1]=s,u[2]=a,u[3]=t,u[4]=r,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],d=i[7],h=i[2],f=i[5],p=i[8],x=s[0],g=s[3],m=s[6],b=s[1],w=s[4],y=s[7],_=s[2],M=s[5],A=s[8];return r[0]=o*x+a*b+l*_,r[3]=o*g+a*w+l*M,r[6]=o*m+a*y+l*A,r[1]=c*x+u*b+d*_,r[4]=c*g+u*w+d*M,r[7]=c*m+u*y+d*A,r[2]=h*x+f*b+p*_,r[5]=h*g+f*w+p*M,r[8]=h*m+f*y+p*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-i*r*u+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=u*o-a*c,h=a*l-u*r,f=c*r-o*l,p=t*d+i*h+s*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/p;return e[0]=d*x,e[1]=(s*c-u*i)*x,e[2]=(a*i-s*o)*x,e[3]=h*x,e[4]=(u*t-s*l)*x,e[5]=(s*r-a*t)*x,e[6]=f*x,e[7]=(i*l-c*t)*x,e[8]=(o*t-i*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return Ar("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Gh.makeScale(e,t)),this}rotate(e){return Ar("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Gh.makeRotation(-e)),this}translate(e,t){return Ar("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Gh.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Vd.prototype.isMatrix3=!0;var it=Vd,Gh=new it,Yp=new it().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),qp=new it().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function W1(){let n={enabled:!0,workingColorSpace:xa,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Lt&&(s.r=_s(s.r),s.g=_s(s.g),s.b=_s(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Lt&&(s.r=bo(s.r),s.g=bo(s.g),s.b=bo(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Ss?ba:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Ar("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Ar("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[xa]:{primaries:e,whitePoint:i,transfer:ba,toXYZ:Yp,fromXYZ:qp,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Wt},outputColorSpaceConfig:{drawingBufferColorSpace:Wt}},[Wt]:{primaries:e,whitePoint:i,transfer:Lt,toXYZ:Yp,fromXYZ:qp,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Wt}}}),n}var bt=W1();function _s(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function bo(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var no,pc=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{no===void 0&&(no=ya("canvas")),no.width=e.width,no.height=e.height;let s=no.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=no}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ya("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=_s(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(_s(t[i]/255)*255):t[i]=_s(t[i]);return{data:t,width:e.width,height:e.height}}else return et("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},X1=0,wo=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:X1++}),this.uuid=Lo(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Vh(s[o].image)):r.push(Vh(s[o]))}else r=Vh(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Vh(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?pc.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(et("Texture: Unable to serialize Texture."),{})}var Y1=0,Wh=new Z,zn=class n extends Qi{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Kn,s=Kn,r=qt,o=Mi,a=Ln,l=ei,c=n.DEFAULT_ANISOTROPY,u=Ss){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Y1++}),this.uuid=Lo(),this.name="",this.source=new wo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ft(0,0),this.repeat=new ft(1,1),this.center=new ft(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new it,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Wh).x}get height(){return this.source.getSize(Wh).y}get depth(){return this.source.getSize(Wh).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){et(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){et(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ad)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case hc:e.x=e.x-Math.floor(e.x);break;case Kn:e.x=e.x<0?0:1;break;case dc:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case hc:e.y=e.y-Math.floor(e.y);break;case Kn:e.y=e.y<0?0:1;break;case dc:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};zn.DEFAULT_IMAGE=null;zn.DEFAULT_MAPPING=Ad;zn.DEFAULT_ANISOTROPY=1;var Wd=class Wd{constructor(e=0,t=0,i=0,s=1){this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],u=l[4],d=l[8],h=l[1],f=l[5],p=l[9],x=l[2],g=l[6],m=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-x)<.01&&Math.abs(p-g)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+x)<.1&&Math.abs(p+g)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(c+1)/2,y=(f+1)/2,_=(m+1)/2,M=(u+h)/4,A=(d+x)/4,v=(p+g)/4;return w>y&&w>_?w<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(w),s=M/i,r=A/i):y>_?y<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),i=M/s,r=v/s):_<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(_),i=A/r,s=v/r),this.set(i,s,r,t),this}let b=Math.sqrt((g-p)*(g-p)+(d-x)*(d-x)+(h-u)*(h-u));return Math.abs(b)<.001&&(b=1),this.x=(g-p)/b,this.y=(d-x)/b,this.z=(h-u)/b,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=yt(this.x,e.x,t.x),this.y=yt(this.y,e.y,t.y),this.z=yt(this.z,e.z,t.z),this.w=yt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=yt(this.x,e,t),this.y=yt(this.y,e,t),this.z=yt(this.z,e,t),this.w=yt(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(yt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Wd.prototype.isVector4=!0;var $t=Wd,mc=class extends Qi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:qt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new $t(0,0,e,t),this.scissorTest=!1,this.viewport=new $t(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:i.depth},r=new zn(s),o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:qt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new wo(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Jn=class extends mc{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},va=class extends zn{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=Kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var gc=class extends zn{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=Kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var kc=class kc{constructor(e,t,i,s,r,o,a,l,c,u,d,h,f,p,x,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,u,d,h,f,p,x,g)}set(e,t,i,s,r,o,a,l,c,u,d,h,f,p,x,g){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=s,m[1]=r,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=u,m[10]=d,m[14]=h,m[3]=f,m[7]=p,m[11]=x,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new kc().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,s=1/io.setFromMatrixColumn(e,0).length(),r=1/io.setFromMatrixColumn(e,1).length(),o=1/io.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let h=o*u,f=o*d,p=a*u,x=a*d;t[0]=l*u,t[4]=-l*d,t[8]=c,t[1]=f+p*c,t[5]=h-x*c,t[9]=-a*l,t[2]=x-h*c,t[6]=p+f*c,t[10]=o*l}else if(e.order==="YXZ"){let h=l*u,f=l*d,p=c*u,x=c*d;t[0]=h+x*a,t[4]=p*a-f,t[8]=o*c,t[1]=o*d,t[5]=o*u,t[9]=-a,t[2]=f*a-p,t[6]=x+h*a,t[10]=o*l}else if(e.order==="ZXY"){let h=l*u,f=l*d,p=c*u,x=c*d;t[0]=h-x*a,t[4]=-o*d,t[8]=p+f*a,t[1]=f+p*a,t[5]=o*u,t[9]=x-h*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let h=o*u,f=o*d,p=a*u,x=a*d;t[0]=l*u,t[4]=p*c-f,t[8]=h*c+x,t[1]=l*d,t[5]=x*c+h,t[9]=f*c-p,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let h=o*l,f=o*c,p=a*l,x=a*c;t[0]=l*u,t[4]=x-h*d,t[8]=p*d+f,t[1]=d,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=f*d+p,t[10]=h-x*d}else if(e.order==="XZY"){let h=o*l,f=o*c,p=a*l,x=a*c;t[0]=l*u,t[4]=-d,t[8]=c*u,t[1]=h*d+x,t[5]=o*u,t[9]=f*d-p,t[2]=p*d-f,t[6]=a*u,t[10]=x*d+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(q1,e,$1)}lookAt(e,t,i){let s=this.elements;return ci.subVectors(e,t),ci.lengthSq()===0&&(ci.z=1),ci.normalize(),Vs.crossVectors(i,ci),Vs.lengthSq()===0&&(Math.abs(i.z)===1?ci.x+=1e-4:ci.z+=1e-4,ci.normalize(),Vs.crossVectors(i,ci)),Vs.normalize(),Ul.crossVectors(ci,Vs),s[0]=Vs.x,s[4]=Ul.x,s[8]=ci.x,s[1]=Vs.y,s[5]=Ul.y,s[9]=ci.y,s[2]=Vs.z,s[6]=Ul.z,s[10]=ci.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],d=i[5],h=i[9],f=i[13],p=i[2],x=i[6],g=i[10],m=i[14],b=i[3],w=i[7],y=i[11],_=i[15],M=s[0],A=s[4],v=s[8],S=s[12],C=s[1],P=s[5],D=s[9],N=s[13],I=s[2],U=s[6],W=s[10],O=s[14],te=s[3],X=s[7],q=s[11],$=s[15];return r[0]=o*M+a*C+l*I+c*te,r[4]=o*A+a*P+l*U+c*X,r[8]=o*v+a*D+l*W+c*q,r[12]=o*S+a*N+l*O+c*$,r[1]=u*M+d*C+h*I+f*te,r[5]=u*A+d*P+h*U+f*X,r[9]=u*v+d*D+h*W+f*q,r[13]=u*S+d*N+h*O+f*$,r[2]=p*M+x*C+g*I+m*te,r[6]=p*A+x*P+g*U+m*X,r[10]=p*v+x*D+g*W+m*q,r[14]=p*S+x*N+g*O+m*$,r[3]=b*M+w*C+y*I+_*te,r[7]=b*A+w*P+y*U+_*X,r[11]=b*v+w*D+y*W+_*q,r[15]=b*S+w*N+y*O+_*$,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],d=e[6],h=e[10],f=e[14],p=e[3],x=e[7],g=e[11],m=e[15],b=l*f-c*h,w=a*f-c*d,y=a*h-l*d,_=o*f-c*u,M=o*h-l*u,A=o*d-a*u;return t*(x*b-g*w+m*y)-i*(p*b-g*_+m*M)+s*(p*w-x*_+m*A)-r*(p*y-x*M+g*A)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[1],o=e[5],a=e[9],l=e[2],c=e[6],u=e[10];return t*(o*u-a*c)-i*(r*u-a*l)+s*(r*c-o*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=e[9],h=e[10],f=e[11],p=e[12],x=e[13],g=e[14],m=e[15],b=t*a-i*o,w=t*l-s*o,y=t*c-r*o,_=i*l-s*a,M=i*c-r*a,A=s*c-r*l,v=u*x-d*p,S=u*g-h*p,C=u*m-f*p,P=d*g-h*x,D=d*m-f*x,N=h*m-f*g,I=b*N-w*D+y*P+_*C-M*S+A*v;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let U=1/I;return e[0]=(a*N-l*D+c*P)*U,e[1]=(s*D-i*N-r*P)*U,e[2]=(x*A-g*M+m*_)*U,e[3]=(h*M-d*A-f*_)*U,e[4]=(l*C-o*N-c*S)*U,e[5]=(t*N-s*C+r*S)*U,e[6]=(g*y-p*A-m*w)*U,e[7]=(u*A-h*y+f*w)*U,e[8]=(o*D-a*C+c*v)*U,e[9]=(i*C-t*D-r*v)*U,e[10]=(p*M-x*y+m*b)*U,e[11]=(d*y-u*M-f*b)*U,e[12]=(a*S-o*P-l*v)*U,e[13]=(t*P-i*S+s*v)*U,e[14]=(x*w-p*_-g*b)*U,e[15]=(u*_-d*w+h*b)*U,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,u=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+i,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,u=o+o,d=a+a,h=r*c,f=r*u,p=r*d,x=o*u,g=o*d,m=a*d,b=l*c,w=l*u,y=l*d,_=i.x,M=i.y,A=i.z;return s[0]=(1-(x+m))*_,s[1]=(f+y)*_,s[2]=(p-w)*_,s[3]=0,s[4]=(f-y)*M,s[5]=(1-(h+m))*M,s[6]=(g+b)*M,s[7]=0,s[8]=(p+w)*A,s[9]=(g-b)*A,s[10]=(1-(h+x))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return i.set(1,1,1),t.identity(),this;let o=io.set(s[0],s[1],s[2]).length(),a=io.set(s[4],s[5],s[6]).length(),l=io.set(s[8],s[9],s[10]).length();r<0&&(o=-o),Li.copy(this);let c=1/o,u=1/a,d=1/l;return Li.elements[0]*=c,Li.elements[1]*=c,Li.elements[2]*=c,Li.elements[4]*=u,Li.elements[5]*=u,Li.elements[6]*=u,Li.elements[8]*=d,Li.elements[9]*=d,Li.elements[10]*=d,t.setFromRotationMatrix(Li),i.x=o,i.y=a,i.z=l,this}makePerspective(e,t,i,s,r,o,a=Ni,l=!1){let c=this.elements,u=2*r/(t-e),d=2*r/(i-s),h=(t+e)/(t-e),f=(i+s)/(i-s),p,x;if(l)p=r/(o-r),x=o*r/(o-r);else if(a===Ni)p=-(o+r)/(o-r),x=-2*o*r/(o-r);else if(a===vo)p=-o/(o-r),x=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=Ni,l=!1){let c=this.elements,u=2/(t-e),d=2/(i-s),h=-(t+e)/(t-e),f=-(i+s)/(i-s),p,x;if(l)p=1/(o-r),x=o/(o-r);else if(a===Ni)p=-2/(o-r),x=-(o+r)/(o-r);else if(a===vo)p=-1/(o-r),x=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};kc.prototype.isMatrix4=!0;var gt=kc,io=new Z,Li=new gt,q1=new Z(0,0,0),$1=new Z(1,1,1),Vs=new Z,Ul=new Z,ci=new Z,$p=new gt,Zp=new es,ts=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],d=s[2],h=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(yt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-yt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(yt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-yt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(yt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-yt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:et("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return $p.makeRotationFromQuaternion(e),this.setFromRotationMatrix($p,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Zp.setFromEuler(this),this.setFromQuaternion(Zp,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ts.DEFAULT_ORDER="XYZ";var So=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Z1=0,Kp=new Z,so=new es,gs=new gt,Ol=new Z,la=new Z,K1=new Z,J1=new es,Jp=new Z(1,0,0),jp=new Z(0,1,0),Qp=new Z(0,0,1),em={type:"added"},j1={type:"removed"},ro={type:"childadded",child:null},Xh={type:"childremoved",child:null},In=class n extends Qi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Z1++}),this.uuid=Lo(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new Z,t=new ts,i=new es,s=new Z(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new gt},normalMatrix:{value:new it}}),this.matrix=new gt,this.matrixWorld=new gt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new So,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return so.setFromAxisAngle(e,t),this.quaternion.multiply(so),this}rotateOnWorldAxis(e,t){return so.setFromAxisAngle(e,t),this.quaternion.premultiply(so),this}rotateX(e){return this.rotateOnAxis(Jp,e)}rotateY(e){return this.rotateOnAxis(jp,e)}rotateZ(e){return this.rotateOnAxis(Qp,e)}translateOnAxis(e,t){return Kp.copy(e).applyQuaternion(this.quaternion),this.position.add(Kp.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Jp,e)}translateY(e){return this.translateOnAxis(jp,e)}translateZ(e){return this.translateOnAxis(Qp,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(gs.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ol.copy(e):Ol.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),la.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?gs.lookAt(la,Ol,this.up):gs.lookAt(Ol,la,this.up),this.quaternion.setFromRotationMatrix(gs),s&&(gs.extractRotation(s.matrixWorld),so.setFromRotationMatrix(gs),this.quaternion.premultiply(so.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(tt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(em),ro.child=e,this.dispatchEvent(ro),ro.child=null):tt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(j1),Xh.child=e,this.dispatchEvent(Xh),Xh.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),gs.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),gs.multiply(e.parent.matrixWorld)),e.applyMatrix4(gs),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(em),ro.child=e,this.dispatchEvent(ro),ro.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(la,e,K1),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(la,J1,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*i-r[8]*s,r[13]+=i-r[1]*t-r[5]*i-r[9]*s,r[14]+=s-r[2]*t-r[6]*i-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),d=o(e.shapes),h=o(e.skeletons),f=o(e.animations),p=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),h.length>0&&(i.skeletons=h),f.length>0&&(i.animations=f),p.length>0&&(i.nodes=p)}return i.object=s,i;function o(a){let l=[];for(let c in a){let u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};In.DEFAULT_UP=new Z(0,1,0);In.DEFAULT_MATRIX_AUTO_UPDATE=!0;In.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var un=class extends In{constructor(){super(),this.isGroup=!0,this.type="Group"}},Q1={type:"move"},To=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new un,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new un,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new Z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new Z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new un,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new Z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new Z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let x of e.hand.values()){let g=t.getJointPose(x,i),m=this._getHandJoint(c,x);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),f=.02,p=.005;c.inputState.pinching&&h>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Q1)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new un;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Qm={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ws={h:0,s:0,l:0},Fl={h:0,s:0,l:0};function Yh(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Re=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Wt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,bt.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=bt.workingColorSpace){return this.r=e,this.g=t,this.b=i,bt.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=bt.workingColorSpace){if(e=Ud(e,1),t=yt(t,0,1),i=yt(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Yh(o,r,e+1/3),this.g=Yh(o,r,e),this.b=Yh(o,r,e-1/3)}return bt.colorSpaceToWorking(this,s),this}setStyle(e,t=Wt){function i(r){r!==void 0&&parseFloat(r)<1&&et("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:et("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);et("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Wt){let i=Qm[e.toLowerCase()];return i!==void 0?this.setHex(i,t):et("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=_s(e.r),this.g=_s(e.g),this.b=_s(e.b),this}copyLinearToSRGB(e){return this.r=bo(e.r),this.g=bo(e.g),this.b=bo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Wt){return bt.workingToColorSpace(Cn.copy(this),e),Math.round(yt(Cn.r*255,0,255))*65536+Math.round(yt(Cn.g*255,0,255))*256+Math.round(yt(Cn.b*255,0,255))}getHexString(e=Wt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=bt.workingColorSpace){bt.workingToColorSpace(Cn.copy(this),t);let i=Cn.r,s=Cn.g,r=Cn.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,u=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=u<=.5?d/(o+a):d/(2-o-a),o){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=bt.workingColorSpace){return bt.workingToColorSpace(Cn.copy(this),t),e.r=Cn.r,e.g=Cn.g,e.b=Cn.b,e}getStyle(e=Wt){bt.workingToColorSpace(Cn.copy(this),e);let t=Cn.r,i=Cn.g,s=Cn.b;return e!==Wt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(Ws),this.setHSL(Ws.h+e,Ws.s+t,Ws.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Ws),e.getHSL(Fl);let i=ma(Ws.h,Fl.h,t),s=ma(Ws.s,Fl.s,t),r=ma(Ws.l,Fl.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Cn=new Re;Re.NAMES=Qm;var _a=class n{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Re(e),this.near=t,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Ma=class extends In{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ts,this.environmentIntensity=1,this.environmentRotation=new ts,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Di=new Z,xs=new Z,qh=new Z,bs=new Z,oo=new Z,ao=new Z,tm=new Z,$h=new Z,Zh=new Z,Kh=new Z,Jh=new $t,jh=new $t,Qh=new $t,$s=class n{constructor(e=new Z,t=new Z,i=new Z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Di.subVectors(e,t),s.cross(Di);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){Di.subVectors(s,t),xs.subVectors(i,t),qh.subVectors(e,t);let o=Di.dot(Di),a=Di.dot(xs),l=Di.dot(qh),c=xs.dot(xs),u=xs.dot(qh),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let h=1/d,f=(c*l-a*u)*h,p=(o*u-a*l)*h;return r.set(1-f-p,p,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,bs)===null?!1:bs.x>=0&&bs.y>=0&&bs.x+bs.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,bs)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,bs.x),l.addScaledVector(o,bs.y),l.addScaledVector(a,bs.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return Jh.setScalar(0),jh.setScalar(0),Qh.setScalar(0),Jh.fromBufferAttribute(e,t),jh.fromBufferAttribute(e,i),Qh.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Jh,r.x),o.addScaledVector(jh,r.y),o.addScaledVector(Qh,r.z),o}static isFrontFacing(e,t,i,s){return Di.subVectors(i,t),xs.subVectors(e,t),Di.cross(xs).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Di.subVectors(this.c,this.b),xs.subVectors(this.a,this.b),Di.cross(xs).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;oo.subVectors(s,i),ao.subVectors(r,i),$h.subVectors(e,i);let l=oo.dot($h),c=ao.dot($h);if(l<=0&&c<=0)return t.copy(i);Zh.subVectors(e,s);let u=oo.dot(Zh),d=ao.dot(Zh);if(u>=0&&d<=u)return t.copy(s);let h=l*d-u*c;if(h<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(oo,o);Kh.subVectors(e,r);let f=oo.dot(Kh),p=ao.dot(Kh);if(p>=0&&f<=p)return t.copy(r);let x=f*c-l*p;if(x<=0&&c>=0&&p<=0)return a=c/(c-p),t.copy(i).addScaledVector(ao,a);let g=u*p-f*d;if(g<=0&&d-u>=0&&f-p>=0)return tm.subVectors(r,s),a=(d-u)/(d-u+(f-p)),t.copy(s).addScaledVector(tm,a);let m=1/(g+x+h);return o=x*m,a=h*m,t.copy(i).addScaledVector(oo,o).addScaledVector(ao,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},ns=class{constructor(e=new Z(1/0,1/0,1/0),t=new Z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(ki.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(ki.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=ki.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,ki):ki.fromBufferAttribute(r,o),ki.applyMatrix4(e.matrixWorld),this.expandByPoint(ki);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Bl.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Bl.copy(i.boundingBox)),Bl.applyMatrix4(e.matrixWorld),this.union(Bl)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ki),ki.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ca),zl.subVectors(this.max,ca),lo.subVectors(e.a,ca),co.subVectors(e.b,ca),uo.subVectors(e.c,ca),Xs.subVectors(co,lo),Ys.subVectors(uo,co),wr.subVectors(lo,uo);let t=[0,-Xs.z,Xs.y,0,-Ys.z,Ys.y,0,-wr.z,wr.y,Xs.z,0,-Xs.x,Ys.z,0,-Ys.x,wr.z,0,-wr.x,-Xs.y,Xs.x,0,-Ys.y,Ys.x,0,-wr.y,wr.x,0];return!ed(t,lo,co,uo,zl)||(t=[1,0,0,0,1,0,0,0,1],!ed(t,lo,co,uo,zl))?!1:(Hl.crossVectors(Xs,Ys),t=[Hl.x,Hl.y,Hl.z],ed(t,lo,co,uo,zl))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ki).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ki).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ys[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ys[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ys[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ys[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ys[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ys[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ys[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ys[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ys),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ys=[new Z,new Z,new Z,new Z,new Z,new Z,new Z,new Z],ki=new Z,Bl=new ns,lo=new Z,co=new Z,uo=new Z,Xs=new Z,Ys=new Z,wr=new Z,ca=new Z,zl=new Z,Hl=new Z,Sr=new Z;function ed(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){Sr.fromArray(n,r);let a=s.x*Math.abs(Sr.x)+s.y*Math.abs(Sr.y)+s.z*Math.abs(Sr.z),l=e.dot(Sr),c=t.dot(Sr),u=i.dot(Sr);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}var ln=new Z,Gl=new ft,ey=0,xn=class extends Qi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:ey++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=$m,this.updateRanges=[],this.gpuType=wi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Gl.fromBufferAttribute(this,t),Gl.applyMatrix3(e),this.setXY(t,Gl.x,Gl.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)ln.fromBufferAttribute(this,t),ln.applyMatrix3(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)ln.fromBufferAttribute(this,t),ln.applyMatrix4(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ln.fromBufferAttribute(this,t),ln.applyNormalMatrix(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ln.fromBufferAttribute(this,t),ln.transformDirection(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=xo(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Bn(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=xo(t,this.array)),t}setX(e,t){return this.normalized&&(t=Bn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=xo(t,this.array)),t}setY(e,t){return this.normalized&&(t=Bn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=xo(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Bn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=xo(t,this.array)),t}setW(e,t){return this.normalized&&(t=Bn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Bn(t,this.array),i=Bn(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=Bn(t,this.array),i=Bn(i,this.array),s=Bn(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=Bn(t,this.array),i=Bn(i,this.array),s=Bn(s,this.array),r=Bn(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Zs=class extends xn{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Ks=class extends xn{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var kt=class extends xn{constructor(e,t,i){super(new Float32Array(e),t,i)}},ty=new ns,ua=new Z,td=new Z,Js=class{constructor(e=new Z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):ty.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ua.subVectors(e,this.center);let t=ua.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(ua,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(td.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ua.copy(e.center).add(td)),this.expandByPoint(ua.copy(e.center).sub(td))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ny=0,_i=new gt,nd=new In,ho=new Z,ui=new ns,ha=new ns,gn=new Z,zt=class n extends Qi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ny++}),this.uuid=Lo(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(E1(e)?Ks:Zs)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new it().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return _i.makeRotationFromQuaternion(e),this.applyMatrix4(_i),this}rotateX(e){return _i.makeRotationX(e),this.applyMatrix4(_i),this}rotateY(e){return _i.makeRotationY(e),this.applyMatrix4(_i),this}rotateZ(e){return _i.makeRotationZ(e),this.applyMatrix4(_i),this}translate(e,t,i){return _i.makeTranslation(e,t,i),this.applyMatrix4(_i),this}scale(e,t,i){return _i.makeScale(e,t,i),this.applyMatrix4(_i),this}lookAt(e){return nd.lookAt(e),nd.updateMatrix(),this.applyMatrix4(nd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ho).negate(),this.translate(ho.x,ho.y,ho.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new kt(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&et("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ns);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){tt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new Z(-1/0,-1/0,-1/0),new Z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];ui.setFromBufferAttribute(r),this.morphTargetsRelative?(gn.addVectors(this.boundingBox.min,ui.min),this.boundingBox.expandByPoint(gn),gn.addVectors(this.boundingBox.max,ui.max),this.boundingBox.expandByPoint(gn)):(this.boundingBox.expandByPoint(ui.min),this.boundingBox.expandByPoint(ui.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&tt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Js);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){tt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new Z,1/0);return}if(e){let i=this.boundingSphere.center;if(ui.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];ha.setFromBufferAttribute(a),this.morphTargetsRelative?(gn.addVectors(ui.min,ha.min),ui.expandByPoint(gn),gn.addVectors(ui.max,ha.max),ui.expandByPoint(gn)):(ui.expandByPoint(ha.min),ui.expandByPoint(ha.max))}ui.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)gn.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(gn));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)gn.fromBufferAttribute(a,c),l&&(ho.fromBufferAttribute(e,c),gn.add(ho)),s=Math.max(s,i.distanceToSquared(gn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&tt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){tt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new xn(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],l=[];for(let v=0;v<i.count;v++)a[v]=new Z,l[v]=new Z;let c=new Z,u=new Z,d=new Z,h=new ft,f=new ft,p=new ft,x=new Z,g=new Z;function m(v,S,C){c.fromBufferAttribute(i,v),u.fromBufferAttribute(i,S),d.fromBufferAttribute(i,C),h.fromBufferAttribute(r,v),f.fromBufferAttribute(r,S),p.fromBufferAttribute(r,C),u.sub(c),d.sub(c),f.sub(h),p.sub(h);let P=1/(f.x*p.y-p.x*f.y);isFinite(P)&&(x.copy(u).multiplyScalar(p.y).addScaledVector(d,-f.y).multiplyScalar(P),g.copy(d).multiplyScalar(f.x).addScaledVector(u,-p.x).multiplyScalar(P),a[v].add(x),a[S].add(x),a[C].add(x),l[v].add(g),l[S].add(g),l[C].add(g))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let v=0,S=b.length;v<S;++v){let C=b[v],P=C.start,D=C.count;for(let N=P,I=P+D;N<I;N+=3)m(e.getX(N+0),e.getX(N+1),e.getX(N+2))}let w=new Z,y=new Z,_=new Z,M=new Z;function A(v){_.fromBufferAttribute(s,v),M.copy(_);let S=a[v];w.copy(S),w.sub(_.multiplyScalar(_.dot(S))).normalize(),y.crossVectors(M,S);let P=y.dot(l[v])<0?-1:1;o.setXYZW(v,w.x,w.y,w.z,P)}for(let v=0,S=b.length;v<S;++v){let C=b[v],P=C.start,D=C.count;for(let N=P,I=P+D;N<I;N+=3)A(e.getX(N+0)),A(e.getX(N+1)),A(e.getX(N+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new xn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,f=i.count;h<f;h++)i.setXYZ(h,0,0,0);let s=new Z,r=new Z,o=new Z,a=new Z,l=new Z,c=new Z,u=new Z,d=new Z;if(e)for(let h=0,f=e.count;h<f;h+=3){let p=e.getX(h+0),x=e.getX(h+1),g=e.getX(h+2);s.fromBufferAttribute(t,p),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,g),u.subVectors(o,r),d.subVectors(s,r),u.cross(d),a.fromBufferAttribute(i,p),l.fromBufferAttribute(i,x),c.fromBufferAttribute(i,g),a.add(u),l.add(u),c.add(u),i.setXYZ(p,a.x,a.y,a.z),i.setXYZ(x,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let h=0,f=t.count;h<f;h+=3)s.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),o.fromBufferAttribute(t,h+2),u.subVectors(o,r),d.subVectors(s,r),u.cross(d),i.setXYZ(h+0,u.x,u.y,u.z),i.setXYZ(h+1,u.x,u.y,u.z),i.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)gn.fromBufferAttribute(e,t),gn.normalize(),e.setXYZ(t,gn.x,gn.y,gn.z)}toNonIndexed(){function e(a,l){let c=a.array,u=a.itemSize,d=a.normalized,h=new c.constructor(l.length*u),f=0,p=0;for(let x=0,g=l.length;x<g;x++){a.isInterleavedBufferAttribute?f=l[x]*a.data.stride+a.offset:f=l[x]*u;for(let m=0;m<u;m++)h[p++]=c[f++]}return new xn(h,u,d)}if(this.index===null)return et("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let u=0,d=c.length;u<d;u++){let h=c[u],f=e(h,i);l.push(f)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){let f=c[d];u.push(f.toJSON(e.data))}u.length>0&&(s[l]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(t))}let r=e.morphAttributes;for(let c in r){let u=[],d=r[c];for(let h=0,f=d.length;h<f;h++)u.push(d[h].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,u=o.length;c<u;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var id=new Z,iy=new Z,sy=new it,hi=class{constructor(e=new Z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=id.subVectors(i,t).cross(iy.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let s=e.delta(id),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/r;return i===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(s,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||sy.getNormalMatrix(e),s=this.coplanarPoint(id).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},ry=0,Ms=class extends Qi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ry++}),this.uuid=Lo(),this.name="",this.type="Material",this.blending=Co,this.side=ir,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=yd,this.blendDst=vd,this.blendEquation=Cr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Re(0,0,0),this.blendAlpha=0,this.depthFunc=yo,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Hm,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ic,this.stencilZFail=ic,this.stencilZPass=ic,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){et(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){et(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Re().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new hi().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ft().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ft().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var vs=new Z,sd=new Z,Vl=new Z,Wl=new Z,wa=class{constructor(e=new Z,t=new Z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,vs)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=vs.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(vs.copy(this.origin).addScaledVector(this.direction,t),vs.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){sd.copy(e).add(t).multiplyScalar(.5),Vl.copy(t).sub(e).normalize(),Wl.copy(this.origin).sub(sd);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Vl),a=Wl.dot(this.direction),l=-Wl.dot(Vl),c=Wl.lengthSq(),u=Math.abs(1-o*o),d,h,f,p;if(u>0)if(d=o*l-a,h=o*a-l,p=r*u,d>=0)if(h>=-p)if(h<=p){let x=1/u;d*=x,h*=x,f=d*(d+o*h+2*a)+h*(o*d+h+2*l)+c}else h=r,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*l)+c;else h=-r,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*l)+c;else h<=-p?(d=Math.max(0,-(-o*r+a)),h=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+h*(h+2*l)+c):h<=p?(d=0,h=Math.min(Math.max(-r,-l),r),f=h*(h+2*l)+c):(d=Math.max(0,-(o*r+a)),h=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+h*(h+2*l)+c);else h=o>0?-r:r,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(sd).addScaledVector(Vl,h),f}intersectSphere(e,t){if(e.radius<0)return null;vs.subVectors(e.center,this.origin);let i=vs.dot(this.direction),s=vs.dot(vs)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,s=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,s=(e.min.x-h.x)*c),u>=0?(r=(e.min.y-h.y)*u,o=(e.max.y-h.y)*u):(r=(e.max.y-h.y)*u,o=(e.min.y-h.y)*u),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-h.z)*d,l=(e.max.z-h.z)*d):(a=(e.max.z-h.z)*d,l=(e.min.z-h.z)*d),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,vs)!==null}intersectTriangle(e,t,i,s,r){let o=this.origin,a=this.direction,l=a.x,c=a.y,u=a.z,d=e.x-o.x,h=e.y-o.y,f=e.z-o.z,p=t.x-o.x,x=t.y-o.y,g=t.z-o.z,m=i.x-o.x,b=i.y-o.y,w=i.z-o.z,y=Math.abs(l),_=Math.abs(c),M=Math.abs(u),A,v,S,C,P,D,N,I,U,W,O,te;if(y>=_&&y>=M?(S=l,D=d,U=p,te=m,l>=0?(A=c,v=u,C=h,P=f,N=x,I=g,W=b,O=w):(A=u,v=c,C=f,P=h,N=g,I=x,W=w,O=b)):_>=M?(S=c,D=h,U=x,te=b,c>=0?(A=u,v=l,C=f,P=d,N=g,I=p,W=w,O=m):(A=l,v=u,C=d,P=f,N=p,I=g,W=m,O=w)):(S=u,D=f,U=g,te=w,u>=0?(A=l,v=c,C=d,P=h,N=p,I=x,W=m,O=b):(A=c,v=l,C=h,P=d,N=x,I=p,W=b,O=m)),S===0)return null;let X=A/S,q=v/S,$=1/S,he=C-X*D,Q=P-q*D,fe=N-X*U,re=I-q*U,pe=W-X*te,k=O-q*te,z=pe*re-k*fe,de=he*k-Q*pe,Ee=fe*Q-re*he;if(s){if(z<0||de<0||Ee<0)return null}else if((z<0||de<0||Ee<0)&&(z>0||de>0||Ee>0))return null;let ge=z+de+Ee;if(ge===0)return null;let Ue=$*(z*D+de*U+Ee*te);return(ge>0?Ue<0:Ue>0)?null:this.at(Ue/ge,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Hn=class extends Ms{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Re(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ts,this.combine=Na,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},nm=new gt,Tr=new wa,Xl=new Js,im=new Z,Yl=new Z,ql=new Z,$l=new Z,rd=new Z,Zl=new Z,sm=new Z,Kl=new Z,St=class extends In{constructor(e=new zt,t=new Hn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Zl.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=a[l],d=r[l];u!==0&&(rd.fromBufferAttribute(d,e),o?Zl.addScaledVector(rd,u):Zl.addScaledVector(rd.sub(t),u))}t.add(Zl)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Xl.copy(i.boundingSphere),Xl.applyMatrix4(r),Tr.copy(e.ray).recast(e.near),!(Xl.containsPoint(Tr.origin)===!1&&(Tr.intersectSphere(Xl,im)===null||Tr.origin.distanceToSquared(im)>(e.far-e.near)**2))&&(nm.copy(r).invert(),Tr.copy(e.ray).applyMatrix4(nm),!(i.boundingBox!==null&&Tr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Tr)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,d=r.attributes.normal,h=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let p=0,x=h.length;p<x;p++){let g=h[p],m=o[g.materialIndex],b=Math.max(g.start,f.start),w=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let y=b,_=w;y<_;y+=3){let M=a.getX(y),A=a.getX(y+1),v=a.getX(y+2);s=Jl(this,m,e,i,c,u,d,M,A,v),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let p=Math.max(0,f.start),x=Math.min(a.count,f.start+f.count);for(let g=p,m=x;g<m;g+=3){let b=a.getX(g),w=a.getX(g+1),y=a.getX(g+2);s=Jl(this,o,e,i,c,u,d,b,w,y),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let p=0,x=h.length;p<x;p++){let g=h[p],m=o[g.materialIndex],b=Math.max(g.start,f.start),w=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let y=b,_=w;y<_;y+=3){let M=y,A=y+1,v=y+2;s=Jl(this,m,e,i,c,u,d,M,A,v),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let p=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let g=p,m=x;g<m;g+=3){let b=g,w=g+1,y=g+2;s=Jl(this,o,e,i,c,u,d,b,w,y),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function oy(n,e,t,i,s,r,o,a){let l;if(e.side===Gn?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===ir,a),l===null)return null;Kl.copy(a),Kl.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Kl);return c<t.near||c>t.far?null:{distance:c,point:Kl.clone(),object:n}}function Jl(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,Yl),n.getVertexPosition(l,ql),n.getVertexPosition(c,$l);let u=oy(n,e,t,i,Yl,ql,$l,sm);if(u){let d=new Z;$s.getBarycoord(sm,Yl,ql,$l,d),s&&(u.uv=$s.getInterpolatedAttribute(s,a,l,c,d,new ft)),r&&(u.uv1=$s.getInterpolatedAttribute(r,a,l,c,d,new ft)),o&&(u.normal=$s.getInterpolatedAttribute(o,a,l,c,d,new Z),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let h={a,b:l,c,normal:new Z,materialIndex:0};$s.getNormal(Yl,ql,$l,h.normal),u.face=h,u.barycoord=d}return u}var ws=class extends zn{constructor(e=null,t=1,i=1,s,r,o,a,l,c=Kt,u=Kt,d,h){super(null,o,a,l,c,u,s,r,d,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var cn=class extends xn{constructor(e,t,i,s=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},fo=new gt,rm=new gt,jl=[],om=new ns,ay=new gt,da=new St,fa=new Js,jn=class extends St{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new cn(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<i;s++)this.setMatrixAt(s,ay)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ns),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,fo),om.copy(e.boundingBox).applyMatrix4(fo),this.boundingBox.union(om)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Js),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,fo),fa.copy(e.boundingSphere).applyMatrix4(fo),this.boundingSphere.union(fa)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=i.length+1,o=e*r+1;for(let a=0;a<i.length;a++)i[a]=s[o+a]}raycast(e,t){let i=this.matrixWorld,s=this.count;if(da.geometry=this.geometry,da.material=this.material,da.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fa.copy(this.boundingSphere),fa.applyMatrix4(i),e.ray.intersectsSphere(fa)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,fo),rm.multiplyMatrices(i,fo),da.matrixWorld=rm,da.raycast(e,jl);for(let o=0,a=jl.length;o<a;o++){let l=jl[o];l.instanceId=r,l.object=this,t.push(l)}jl.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new cn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let i=t.morphTargetInfluences,s=i.length+1;this.morphTexture===null&&(this.morphTexture=new ws(new Float32Array(s*this.count),s,this.count,Hc,wi));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<i.length;c++)o+=i[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*e;return r[l]=a,r.set(i,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Er=new Js,ly=new ft(.5,.5),Ql=new Z,Eo=class{constructor(e=new hi,t=new hi,i=new hi,s=new hi,r=new hi,o=new hi){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Ni,i=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],u=r[4],d=r[5],h=r[6],f=r[7],p=r[8],x=r[9],g=r[10],m=r[11],b=r[12],w=r[13],y=r[14],_=r[15];if(s[0].setComponents(c-o,f-u,m-p,_-b).normalize(),s[1].setComponents(c+o,f+u,m+p,_+b).normalize(),s[2].setComponents(c+a,f+d,m+x,_+w).normalize(),s[3].setComponents(c-a,f-d,m-x,_-w).normalize(),i)s[4].setComponents(l,h,g,y).normalize(),s[5].setComponents(c-l,f-h,m-g,_-y).normalize();else if(s[4].setComponents(c-l,f-h,m-g,_-y).normalize(),t===Ni)s[5].setComponents(c+l,f+h,m+g,_+y).normalize();else if(t===vo)s[5].setComponents(l,h,g,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Er.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Er.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Er)}intersectsSprite(e){Er.center.set(0,0,0);let t=ly.distanceTo(e.center);return Er.radius=.7071067811865476+t,Er.applyMatrix4(e.matrixWorld),this.intersectsSphere(Er)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Ql.x=s.normal.x>0?e.max.x:e.min.x,Ql.y=s.normal.y>0?e.max.y:e.min.y,Ql.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Ql)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Sa=class extends zn{constructor(e=[],t=sr,i,s,r,o,a,l,c,u){super(e,t,i,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Ui=class extends zn{constructor(e,t,i,s,r,o,a,l,c){super(e,t,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var js=class extends zn{constructor(e,t,i=Fi,s,r,o,a=Kt,l=Kt,c,u=ji,d=1){if(u!==ji&&u!==rr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:t,depth:d};super(h,s,r,o,a,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new wo(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},xc=class extends js{constructor(e,t=Fi,i=sr,s,r,o=Kt,a=Kt,l,c=ji){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,i,s,r,o,a,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Ta=class extends zn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Qs=class n extends zt{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],u=[],d=[],h=0,f=0;p("z","y","x",-1,-1,i,t,e,o,r,0),p("z","y","x",1,-1,i,t,-e,o,r,1),p("x","z","y",1,1,e,i,t,s,o,2),p("x","z","y",1,-1,e,i,-t,s,o,3),p("x","y","z",1,-1,e,t,i,s,r,4),p("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new kt(c,3)),this.setAttribute("normal",new kt(u,3)),this.setAttribute("uv",new kt(d,2));function p(x,g,m,b,w,y,_,M,A,v,S){let C=y/A,P=_/v,D=y/2,N=_/2,I=M/2,U=A+1,W=v+1,O=0,te=0,X=new Z;for(let q=0;q<W;q++){let $=q*P-N;for(let he=0;he<U;he++){let Q=he*C-D;X[x]=Q*b,X[g]=$*w,X[m]=I,c.push(X.x,X.y,X.z),X[x]=0,X[g]=0,X[m]=M>0?1:-1,u.push(X.x,X.y,X.z),d.push(he/A),d.push(1-q/v),O+=1}}for(let q=0;q<v;q++)for(let $=0;$<A;$++){let he=h+$+U*q,Q=h+$+U*(q+1),fe=h+($+1)+U*(q+1),re=h+($+1)+U*q;l.push(he,Q,re),l.push(Q,fe,re),te+=6}a.addGroup(f,te,S),f+=te,h+=O}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var di=class n extends zt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,u=l+1,d=e/a,h=t/l,f=[],p=[],x=[],g=[];for(let m=0;m<u;m++){let b=m*h-o;for(let w=0;w<c;w++){let y=w*d-r;p.push(y,-b,0),x.push(0,0,1),g.push(w/a),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let b=0;b<a;b++){let w=b+c*m,y=b+c*(m+1),_=b+1+c*(m+1),M=b+1+c*m;f.push(w,y,M),f.push(y,_,M)}this.setIndex(f),this.setAttribute("position",new kt(p,3)),this.setAttribute("normal",new kt(x,3)),this.setAttribute("uv",new kt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};function Ir(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];if(am(s))s.isRenderTargetTexture?(et("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone();else if(Array.isArray(s))if(am(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();e[t][i]=r}else e[t][i]=s.slice();else e[t][i]=s}}return e}function Dn(n){let e={};for(let t=0;t<n.length;t++){let i=Ir(n[t]);for(let s in i)e[s]=i[s]}return e}function am(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function cy(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Od(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:bt.workingColorSpace}var e0={clone:Ir,merge:Dn},uy=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,hy=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,vn=class extends Ms{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=uy,this.fragmentShader=hy,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ir(e.uniforms),this.uniformsGroups=cy(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let s=e.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=t[s.value]||null;break;case"c":this.uniforms[i].value=new Re().setHex(s.value);break;case"v2":this.uniforms[i].value=new ft().fromArray(s.value);break;case"v3":this.uniforms[i].value=new Z().fromArray(s.value);break;case"v4":this.uniforms[i].value=new $t().fromArray(s.value);break;case"m3":this.uniforms[i].value=new it().fromArray(s.value);break;case"m4":this.uniforms[i].value=new gt().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},bc=class extends vn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Ea=class extends Ms{constructor(e){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new Re(16777215),this.specular=new Re(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Re(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xa,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ts,this.combine=Na,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Qn=class extends Ms{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Re(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Re(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xa,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ts,this.combine=Na,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},yc=class extends Ms{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Bm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},vc=class extends Ms{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function po(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function od(n){return n!==void 0&&n.inTangents!==void 0&&n.outTangents!==void 0}var er=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];e:{t:{let o;n:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break t}o=t.length;break n}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break t}o=i,i=0;break n}break e}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},_c=class extends er{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:cd,endingEnd:cd}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case ud:r=e,a=2*t-i;break;case hd:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case ud:o=e,l=2*i-t;break;case hd:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,u=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,f=this._weightNext,p=(i-t)/(s-t),x=p*p,g=x*p,m=-h*g+2*h*x-h*p,b=(1+h)*g+(-1.5-2*h)*x+(-.5+h)*p+1,w=(-1-f)*g+(1.5+f)*x+.5*p,y=f*g-f*x;for(let _=0;_!==a;++_)r[_]=m*o[u+_]+b*o[c+_]+w*o[l+_]+y*o[d+_];return r}},Mc=class extends er{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=(i-t)/(s-t),d=1-u;for(let h=0;h!==a;++h)r[h]=o[c+h]*d+o[l+h]*u;return r}},wc=class extends er{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Sc=class extends er{interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this.inTangents,d=this.outTangents;if(!u||!d){let p=(i-t)/(s-t),x=1-p;for(let g=0;g!==a;++g)r[g]=o[c+g]*x+o[l+g]*p;return r}let h=a*2,f=e-1;for(let p=0;p!==a;++p){let x=o[c+p],g=o[l+p],m=f*h+p*2,b=d[m],w=d[m+1],y=e*h+p*2,_=u[y],M=u[y+1],A=fy(i,t,b,_,s);r[p]=t0(A,x,w,M,g)}return r}};function t0(n,e,t,i,s){let r=1-n;return r*r*r*e+3*r*r*n*t+3*r*n*n*i+n*n*n*s}function dy(n,e,t,i,s){let r=1-n;return 3*r*r*(t-e)+6*r*n*(i-t)+3*n*n*(s-i)}function fy(n,e,t,i,s){let r=(n-e)/(s-e);for(let o=0;o<8;o++){let a=t0(r,e,t,i,s)-n;if(Math.abs(a)<1e-10)break;let l=dy(r,e,t,i,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-a/l))}return r}var fi=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=po(t,this.TimeBufferType),this.values=po(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:po(e.times,Array),values:po(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s),od(e.settings)&&(i.settings={inTangents:po(e.settings.inTangents,Array),outTangents:po(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new wc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Mc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new _c(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Sc(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case ga:t=this.InterpolantFactoryMethodDiscrete;break;case fc:t=this.InterpolantFactoryMethodLinear;break;case nc:t=this.InterpolantFactoryMethodSmooth;break;case ld:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return et("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ga;case this.InterpolantFactoryMethodLinear:return fc;case this.InterpolantFactoryMethodSmooth:return nc;case this.InterpolantFactoryMethodBezier:return ld}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e;od(this.settings)&&(lm(this.settings.inTangents,e),lm(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(tt("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(tt("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){tt("KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){tt("KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&A1(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){tt("KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===nc,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],u=e[a+1];if(c!==u&&(a!==1||c!==e[0]))if(s)l=!0;else{let d=a*i,h=d-i,f=d+i;for(let p=0;p!==i;++p){let x=t[d+p];if(x!==t[h+p]||x!==t[f+p]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let d=a*i,h=o*i;for(let f=0;f!==i;++f)t[h+f]=t[d+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,od(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function lm(n,e){for(let t=0,i=n.length;t!==i;t+=2)n[t]*=e}fi.prototype.ValueTypeName="";fi.prototype.TimeBufferType=Float32Array;fi.prototype.ValueBufferType=Float32Array;fi.prototype.DefaultInterpolation=fc;var tr=class extends fi{constructor(e,t,i){super(e,t,i)}};tr.prototype.ValueTypeName="bool";tr.prototype.ValueBufferType=Array;tr.prototype.DefaultInterpolation=ga;tr.prototype.InterpolantFactoryMethodLinear=void 0;tr.prototype.InterpolantFactoryMethodSmooth=void 0;var Tc=class extends fi{constructor(e,t,i,s){super(e,t,i,s)}};Tc.prototype.ValueTypeName="color";var Ec=class extends fi{constructor(e,t,i,s){super(e,t,i,s)}};Ec.prototype.ValueTypeName="number";var Ac=class extends er{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let u=c+a;c!==u;c+=4)es.slerpFlat(r,0,o,c-a,o,c,l);return r}},Aa=class extends fi{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new Ac(this.times,this.values,this.getValueSize(),e)}};Aa.prototype.ValueTypeName="quaternion";Aa.prototype.InterpolantFactoryMethodSmooth=void 0;var nr=class extends fi{constructor(e,t,i){super(e,t,i)}};nr.prototype.ValueTypeName="string";nr.prototype.ValueBufferType=Array;nr.prototype.DefaultInterpolation=ga;nr.prototype.InterpolantFactoryMethodLinear=void 0;nr.prototype.InterpolantFactoryMethodSmooth=void 0;var Rc=class extends fi{constructor(e,t,i,s){super(e,t,i,s)}};Rc.prototype.ValueTypeName="vector";var Cc=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){let d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=c.length;d<h;d+=2){let f=c[d],p=c[d+1];if(f.global&&(f.lastIndex=0),f.test(u))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},n0=new Cc,Pc=class{constructor(e){this.manager=e!==void 0?e:n0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Pc.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ra=class extends In{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Re(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ca=class extends Ra{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(In.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Re(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},ad=new gt,cm=new Z,um=new Z,Ic=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ft(512,512),this.mapType=ei,this.map=null,this.mapPass=null,this.matrix=new gt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Eo,this._frameExtents=new ft(1,1),this._viewportCount=1,this._viewports=[new $t(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;cm.setFromMatrixPosition(e.matrixWorld),t.position.copy(cm),um.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(um),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,s){ad.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(ad,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,o=s?s.z/r.x:1,a=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===vo||e.reversedDepth?t.set(.5*o,0,0,.5*o+l,0,.5*a,0,.5*a+c,0,0,1,0,0,0,0,1):t.set(.5*o,0,0,.5*o+l,0,.5*a,0,.5*a+c,0,0,.5,.5,0,0,0,1),t.multiply(ad)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ec=new Z,tc=new es,Ji=new Z,Pa=class extends In{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new gt,this.projectionMatrix=new gt,this.projectionMatrixInverse=new gt,this.coordinateSystem=Ni,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ec,tc,Ji),Ji.x===1&&Ji.y===1&&Ji.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ec,tc,Ji.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(ec,tc,Ji),Ji.x===1&&Ji.y===1&&Ji.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ec,tc,Ji.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},qs=new Z,hm=new ft,dm=new ft,Pn=class extends Pa{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Mo*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(pa*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Mo*2*Math.atan(Math.tan(pa*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){qs.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(qs.x,qs.y).multiplyScalar(-e/qs.z),qs.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(qs.x,qs.y).multiplyScalar(-e/qs.z)}getViewSize(e,t){return this.getViewBounds(e,hm,dm),t.subVectors(dm,hm)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(pa*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var Ao=class extends Pa{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},dd=class extends Ic{constructor(){super(new Ao(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ia=class extends Ra{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(In.DEFAULT_UP),this.updateMatrix(),this.target=new In,this.shadow=new dd}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var La=class extends zt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var mo=-90,go=1,Lc=class extends In{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Pn(mo,go,e,t);s.layers=this.layers,this.add(s);let r=new Pn(mo,go,e,t);r.layers=this.layers,this.add(r);let o=new Pn(mo,go,e,t);o.layers=this.layers,this.add(o);let a=new Pn(mo,go,e,t);a.layers=this.layers,this.add(a);let l=new Pn(mo,go,e,t);l.layers=this.layers,this.add(l);let c=new Pn(mo,go,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===Ni)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===vo)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,u]=this.children,d=e.getRenderTarget(),h=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(i,0,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(i,1,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=x,e.setRenderTarget(i,5,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(d,h,f),e.xr.enabled=p,i.texture.needsPMREMUpdate=!0}},Dc=class extends Pn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Fd="\\[\\]\\.:\\/",py=new RegExp("["+Fd+"]","g"),Bd="[^"+Fd+"]",my="[^"+Fd.replace("\\.","")+"]",gy=/((?:WC+[\/:])*)/.source.replace("WC",Bd),xy=/(WCOD+)?/.source.replace("WCOD",my),by=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Bd),yy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Bd),vy=new RegExp("^"+gy+xy+by+yy+"$"),_y=["material","materials","bones","map"],fd=class{constructor(e,t,i){let s=i||Vt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},Vt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(py,"")}static parseTrackName(e){let t=vy.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);_y.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){et("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){tt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){tt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){tt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){tt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){tt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){tt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){tt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;tt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){tt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){tt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Vt.Composite=fd;Vt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Vt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Vt.prototype.GetterByBindingType=[Vt.prototype._getValue_direct,Vt.prototype._getValue_array,Vt.prototype._getValue_arrayElement,Vt.prototype._getValue_toArray];Vt.prototype.SetterByBindingTypeAndVersioning=[[Vt.prototype._setValue_direct,Vt.prototype._setValue_direct_setNeedsUpdate,Vt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Vt.prototype._setValue_array,Vt.prototype._setValue_array_setNeedsUpdate,Vt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Vt.prototype._setValue_arrayElement,Vt.prototype._setValue_arrayElement_setNeedsUpdate,Vt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Vt.prototype._setValue_fromArray,Vt.prototype._setValue_fromArray_setNeedsUpdate,Vt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var V3=new Float32Array(1);var fm=new gt,Da=class{constructor(e,t,i=0,s=1/0){this.ray=new wa(e,t),this.near=i,this.far=s,this.camera=null,this.layers=new So,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):tt("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return fm.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(fm),this}intersectObject(e,t=!0,i=[]){return pd(e,this,i,t),i.sort(pm),i}intersectObjects(e,t=!0,i=[]){for(let s=0,r=e.length;s<r;s++)pd(e[s],this,i,t);return i.sort(pm),i}};function pm(n,e){return n.distance-e.distance}function pd(n,e,t,i){let s=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(s=!1),s===!0&&i===!0){let r=n.children;for(let o=0,a=r.length;o<a;o++)pd(r[o],e,t,!0)}}var Xd=class Xd{constructor(e,t,i,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=i,r[3]=s,this}};Xd.prototype.isMatrix2=!0;var md=Xd;function zd(n,e,t,i){let s=My(i);switch(t){case Ld:return n*e;case Hc:return n*e/s.components*s.byteLength;case Gc:return n*e/s.components*s.byteLength;case or:return n*e*2/s.components*s.byteLength;case Vc:return n*e*2/s.components*s.byteLength;case Dd:return n*e*3/s.components*s.byteLength;case Ln:return n*e*4/s.components*s.byteLength;case Wc:return n*e*4/s.components*s.byteLength;case Ba:case za:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ha:case Ga:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Yc:case $c:return Math.max(n,16)*Math.max(e,8)/4;case Xc:case qc:return Math.max(n,8)*Math.max(e,8)/2;case Zc:case Kc:case jc:case Qc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Jc:case Va:case eu:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case tu:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case nu:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case iu:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case su:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case ru:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ou:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case au:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case lu:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case cu:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case uu:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case hu:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case du:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case fu:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case pu:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case mu:case gu:case xu:return Math.ceil(n/4)*Math.ceil(e/4)*16;case bu:case yu:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Wa:case vu:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function My(n){switch(n){case ei:case Rd:return{byteLength:1,components:1};case Po:case Cd:case Bi:return{byteLength:2,components:1};case Bc:case zc:return{byteLength:2,components:4};case Fi:case Fc:case wi:return{byteLength:4,components:1};case Pd:case Id:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?et("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function S0(){let n=null,e=!1,t=null,i=null;function s(r,o){i=n.requestAnimationFrame(s),t(r,o)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Sy(n){let e=new WeakMap;function t(a,l){let c=a.array,u=a.usage,d=c.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let u=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,u);else{d.sort((f,p)=>f.start-p.start);let h=0;for(let f=1;f<d.length;f++){let p=d[h],x=d[f];x.start<=p.start+p.count+1?p.count=Math.max(p.count,x.start+x.count-p.start):(++h,d[h]=x)}d.length=h+1;for(let f=0,p=d.length;f<p;f++){let x=d[f];n.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Ty=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ey=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ay=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ry=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Cy=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Py=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Iy=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ly=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Dy=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,ky=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ny=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Uy=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Oy=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Fy=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,By=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,zy=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Hy=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gy=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Vy=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Wy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Xy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Yy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,qy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,$y=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Zy=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ky=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Jy=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,jy=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Qy=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ev=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,tv="gl_FragColor = linearToOutputTexel( gl_FragColor );",nv=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,iv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,sv=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,rv=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ov=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,av=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,lv=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,cv=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,uv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,hv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,dv=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,fv=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,pv=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,mv=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,gv=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,xv=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,bv=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,yv=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,vv=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,_v=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Mv=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wv=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Sv=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Tv=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Ev=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Av=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Rv=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Cv=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Pv=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Iv=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Lv=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Dv=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,kv=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Nv=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Uv=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ov=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Fv=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Bv=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,zv=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Hv=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Gv=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vv=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Wv=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Xv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Yv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,qv=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,$v=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Zv=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Kv=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Jv=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,jv=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Qv=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,e_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,t_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,n_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,i_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,s_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,r_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,o_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,a_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,l_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,c_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,u_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,h_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,d_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,f_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,p_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,m_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,g_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,x_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,b_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,y_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,v_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,__=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,M_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,w_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,S_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,T_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,E_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,A_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,R_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,C_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,P_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,I_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,L_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,D_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,k_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,N_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,U_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,O_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,F_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,B_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,z_=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,H_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,G_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,V_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,W_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,X_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Y_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,q_=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$_=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Z_=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,K_=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,J_=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,j_=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Q_=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,eM=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,tM=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,nM=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,iM=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sM=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ht={alphahash_fragment:Ty,alphahash_pars_fragment:Ey,alphamap_fragment:Ay,alphamap_pars_fragment:Ry,alphatest_fragment:Cy,alphatest_pars_fragment:Py,aomap_fragment:Iy,aomap_pars_fragment:Ly,batching_pars_vertex:Dy,batching_vertex:ky,begin_vertex:Ny,beginnormal_vertex:Uy,bsdfs:Oy,iridescence_fragment:Fy,bumpmap_pars_fragment:By,clipping_planes_fragment:zy,clipping_planes_pars_fragment:Hy,clipping_planes_pars_vertex:Gy,clipping_planes_vertex:Vy,color_fragment:Wy,color_pars_fragment:Xy,color_pars_vertex:Yy,color_vertex:qy,common:$y,cube_uv_reflection_fragment:Zy,defaultnormal_vertex:Ky,displacementmap_pars_vertex:Jy,displacementmap_vertex:jy,emissivemap_fragment:Qy,emissivemap_pars_fragment:ev,colorspace_fragment:tv,colorspace_pars_fragment:nv,envmap_fragment:iv,envmap_common_pars_fragment:sv,envmap_pars_fragment:rv,envmap_pars_vertex:ov,envmap_physical_pars_fragment:xv,envmap_vertex:av,fog_vertex:lv,fog_pars_vertex:cv,fog_fragment:uv,fog_pars_fragment:hv,gradientmap_pars_fragment:dv,lightmap_pars_fragment:fv,lights_lambert_fragment:pv,lights_lambert_pars_fragment:mv,lights_pars_begin:gv,lights_toon_fragment:bv,lights_toon_pars_fragment:yv,lights_phong_fragment:vv,lights_phong_pars_fragment:_v,lights_physical_fragment:Mv,lights_physical_pars_fragment:wv,lights_fragment_begin:Sv,lights_fragment_maps:Tv,lights_fragment_end:Ev,lightprobes_pars_fragment:Av,logdepthbuf_fragment:Rv,logdepthbuf_pars_fragment:Cv,logdepthbuf_pars_vertex:Pv,logdepthbuf_vertex:Iv,map_fragment:Lv,map_pars_fragment:Dv,map_particle_fragment:kv,map_particle_pars_fragment:Nv,metalnessmap_fragment:Uv,metalnessmap_pars_fragment:Ov,morphinstance_vertex:Fv,morphcolor_vertex:Bv,morphnormal_vertex:zv,morphtarget_pars_vertex:Hv,morphtarget_vertex:Gv,normal_fragment_begin:Vv,normal_fragment_maps:Wv,normal_pars_fragment:Xv,normal_pars_vertex:Yv,normal_vertex:qv,normalmap_pars_fragment:$v,clearcoat_normal_fragment_begin:Zv,clearcoat_normal_fragment_maps:Kv,clearcoat_pars_fragment:Jv,iridescence_pars_fragment:jv,opaque_fragment:Qv,packing:e_,premultiplied_alpha_fragment:t_,project_vertex:n_,dithering_fragment:i_,dithering_pars_fragment:s_,roughnessmap_fragment:r_,roughnessmap_pars_fragment:o_,shadowmap_pars_fragment:a_,shadowmap_pars_vertex:l_,shadowmap_vertex:c_,shadowmask_pars_fragment:u_,skinbase_vertex:h_,skinning_pars_vertex:d_,skinning_vertex:f_,skinnormal_vertex:p_,specularmap_fragment:m_,specularmap_pars_fragment:g_,tonemapping_fragment:x_,tonemapping_pars_fragment:b_,transmission_fragment:y_,transmission_pars_fragment:v_,uv_pars_fragment:__,uv_pars_vertex:M_,uv_vertex:w_,worldpos_vertex:S_,background_vert:T_,background_frag:E_,backgroundCube_vert:A_,backgroundCube_frag:R_,cube_vert:C_,cube_frag:P_,depth_vert:I_,depth_frag:L_,distance_vert:D_,distance_frag:k_,equirect_vert:N_,equirect_frag:U_,linedashed_vert:O_,linedashed_frag:F_,meshbasic_vert:B_,meshbasic_frag:z_,meshlambert_vert:H_,meshlambert_frag:G_,meshmatcap_vert:V_,meshmatcap_frag:W_,meshnormal_vert:X_,meshnormal_frag:Y_,meshphong_vert:q_,meshphong_frag:$_,meshphysical_vert:Z_,meshphysical_frag:K_,meshtoon_vert:J_,meshtoon_frag:j_,points_vert:Q_,points_frag:eM,shadow_vert:tM,shadow_frag:nM,sprite_vert:iM,sprite_frag:sM},Pe={common:{diffuse:{value:new Re(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new it},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new it}},envmap:{envMap:{value:null},envMapRotation:{value:new it},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new it}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new it}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new it},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new it},normalScale:{value:new ft(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new it},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new it}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new it}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new it}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Re(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new Z},probesMax:{value:new Z},probesResolution:{value:new Z}},points:{diffuse:{value:new Re(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0},uvTransform:{value:new it}},sprite:{diffuse:{value:new Re(16777215)},opacity:{value:1},center:{value:new ft(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new it},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0}}},rs={basic:{uniforms:Dn([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.fog]),vertexShader:ht.meshbasic_vert,fragmentShader:ht.meshbasic_frag},lambert:{uniforms:Dn([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,Pe.lights,{emissive:{value:new Re(0)},envMapIntensity:{value:1}}]),vertexShader:ht.meshlambert_vert,fragmentShader:ht.meshlambert_frag},phong:{uniforms:Dn([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,Pe.lights,{emissive:{value:new Re(0)},specular:{value:new Re(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ht.meshphong_vert,fragmentShader:ht.meshphong_frag},standard:{uniforms:Dn([Pe.common,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.roughnessmap,Pe.metalnessmap,Pe.fog,Pe.lights,{emissive:{value:new Re(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ht.meshphysical_vert,fragmentShader:ht.meshphysical_frag},toon:{uniforms:Dn([Pe.common,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.gradientmap,Pe.fog,Pe.lights,{emissive:{value:new Re(0)}}]),vertexShader:ht.meshtoon_vert,fragmentShader:ht.meshtoon_frag},matcap:{uniforms:Dn([Pe.common,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,{matcap:{value:null}}]),vertexShader:ht.meshmatcap_vert,fragmentShader:ht.meshmatcap_frag},points:{uniforms:Dn([Pe.points,Pe.fog]),vertexShader:ht.points_vert,fragmentShader:ht.points_frag},dashed:{uniforms:Dn([Pe.common,Pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ht.linedashed_vert,fragmentShader:ht.linedashed_frag},depth:{uniforms:Dn([Pe.common,Pe.displacementmap]),vertexShader:ht.depth_vert,fragmentShader:ht.depth_frag},normal:{uniforms:Dn([Pe.common,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,{opacity:{value:1}}]),vertexShader:ht.meshnormal_vert,fragmentShader:ht.meshnormal_frag},sprite:{uniforms:Dn([Pe.sprite,Pe.fog]),vertexShader:ht.sprite_vert,fragmentShader:ht.sprite_frag},background:{uniforms:{uvTransform:{value:new it},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ht.background_vert,fragmentShader:ht.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new it}},vertexShader:ht.backgroundCube_vert,fragmentShader:ht.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ht.cube_vert,fragmentShader:ht.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ht.equirect_vert,fragmentShader:ht.equirect_frag},distance:{uniforms:Dn([Pe.common,Pe.displacementmap,{referencePosition:{value:new Z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ht.distance_vert,fragmentShader:ht.distance_frag},shadow:{uniforms:Dn([Pe.lights,Pe.fog,{color:{value:new Re(0)},opacity:{value:1}}]),vertexShader:ht.shadow_vert,fragmentShader:ht.shadow_frag}};rs.physical={uniforms:Dn([rs.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new it},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new it},clearcoatNormalScale:{value:new ft(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new it},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new it},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new it},sheen:{value:0},sheenColor:{value:new Re(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new it},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new it},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new it},transmissionSamplerSize:{value:new ft},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new it},attenuationDistance:{value:0},attenuationColor:{value:new Re(0)},specularColor:{value:new Re(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new it},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new it},anisotropyVector:{value:new ft},anisotropyMap:{value:null},anisotropyMapTransform:{value:new it}}]),vertexShader:ht.meshphysical_vert,fragmentShader:ht.meshphysical_frag};var Su={r:0,b:0,g:0},rM=new gt,T0=new it;T0.set(-1,0,0,0,1,0,0,0,1);function oM(n,e,t,i,s,r){let o=new Re(0),a=s===!0?0:1,l,c,u=null,d=0,h=null;function f(b){let w=b.isScene===!0?b.background:null;if(w&&w.isTexture){let y=b.backgroundBlurriness>0;w=e.get(w,y)}return w}function p(b){let w=!1,y=f(b);y===null?g(o,a):y&&y.isColor&&(g(y,1),w=!0);let _=n.xr.getEnvironmentBlendMode();_==="additive"?t.buffers.color.setClear(0,0,0,1,r):_==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(n.autoClear||w)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function x(b,w){let y=f(w);y&&(y.isCubeTexture||y.mapping===Oa)?(c===void 0&&(c=new St(new Qs(1,1,1),new vn({name:"BackgroundCubeMaterial",uniforms:Ir(rs.backgroundCube.uniforms),vertexShader:rs.backgroundCube.vertexShader,fragmentShader:rs.backgroundCube.fragmentShader,side:Gn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(_,M,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(rM.makeRotationFromEuler(w.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(T0),c.material.toneMapped=bt.getTransfer(y.colorSpace)!==Lt,(u!==y||d!==y.version||h!==n.toneMapping)&&(c.material.needsUpdate=!0,u=y,d=y.version,h=n.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new St(new di(2,2),new vn({name:"BackgroundMaterial",uniforms:Ir(rs.background.uniforms),vertexShader:rs.background.vertexShader,fragmentShader:rs.background.fragmentShader,side:ir,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=bt.getTransfer(y.colorSpace)!==Lt,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||d!==y.version||h!==n.toneMapping)&&(l.material.needsUpdate=!0,u=y,d=y.version,h=n.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function g(b,w){b.getRGB(Su,Od(n)),t.buffers.color.setClear(Su.r,Su.g,Su.b,w,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(b,w=1){o.set(b),a=w,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(b){a=b,g(o,a)},render:p,addToRenderList:x,dispose:m}}function aM(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=h(null),r=s,o=!1;function a(P,D,N,I,U){let W=!1,O=d(P,I,N,D);r!==O&&(r=O,c(r.object)),W=f(P,I,N,U),W&&p(P,I,N,U),U!==null&&e.update(U,n.ELEMENT_ARRAY_BUFFER),(W||o)&&(o=!1,y(P,D,N,I),U!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(U).buffer))}function l(){return n.createVertexArray()}function c(P){return n.bindVertexArray(P)}function u(P){return n.deleteVertexArray(P)}function d(P,D,N,I){let U=I.wireframe===!0,W=i[D.id];W===void 0&&(W={},i[D.id]=W);let O=P.isInstancedMesh===!0?P.id:0,te=W[O];te===void 0&&(te={},W[O]=te);let X=te[N.id];X===void 0&&(X={},te[N.id]=X);let q=X[U];return q===void 0&&(q=h(l()),X[U]=q),q}function h(P){let D=[],N=[],I=[];for(let U=0;U<t;U++)D[U]=0,N[U]=0,I[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:N,attributeDivisors:I,object:P,attributes:{},index:null}}function f(P,D,N,I){let U=r.attributes,W=D.attributes,O=0,te=N.getAttributes();for(let X in te)if(te[X].location>=0){let $=U[X],he=W[X];if(he===void 0&&(X==="instanceMatrix"&&P.instanceMatrix&&(he=P.instanceMatrix),X==="instanceColor"&&P.instanceColor&&(he=P.instanceColor)),$===void 0||$.attribute!==he||he&&$.data!==he.data)return!0;O++}return r.attributesNum!==O||r.index!==I}function p(P,D,N,I){let U={},W=D.attributes,O=0,te=N.getAttributes();for(let X in te)if(te[X].location>=0){let $=W[X];$===void 0&&(X==="instanceMatrix"&&P.instanceMatrix&&($=P.instanceMatrix),X==="instanceColor"&&P.instanceColor&&($=P.instanceColor));let he={};he.attribute=$,$&&$.data&&(he.data=$.data),U[X]=he,O++}r.attributes=U,r.attributesNum=O,r.index=I}function x(){let P=r.newAttributes;for(let D=0,N=P.length;D<N;D++)P[D]=0}function g(P){m(P,0)}function m(P,D){let N=r.newAttributes,I=r.enabledAttributes,U=r.attributeDivisors;N[P]=1,I[P]===0&&(n.enableVertexAttribArray(P),I[P]=1),U[P]!==D&&(n.vertexAttribDivisor(P,D),U[P]=D)}function b(){let P=r.newAttributes,D=r.enabledAttributes;for(let N=0,I=D.length;N<I;N++)D[N]!==P[N]&&(n.disableVertexAttribArray(N),D[N]=0)}function w(P,D,N,I,U,W,O){O===!0?n.vertexAttribIPointer(P,D,N,U,W):n.vertexAttribPointer(P,D,N,I,U,W)}function y(P,D,N,I){x();let U=I.attributes,W=N.getAttributes(),O=D.defaultAttributeValues;for(let te in W){let X=W[te];if(X.location>=0){let q=U[te];if(q===void 0&&(te==="instanceMatrix"&&P.instanceMatrix&&(q=P.instanceMatrix),te==="instanceColor"&&P.instanceColor&&(q=P.instanceColor)),q!==void 0){let $=q.normalized,he=q.itemSize,Q=e.get(q);if(Q===void 0)continue;let fe=Q.buffer,re=Q.type,pe=Q.bytesPerElement,k=re===n.INT||re===n.UNSIGNED_INT||q.gpuType===Fc;if(q.isInterleavedBufferAttribute){let z=q.data,de=z.stride,Ee=q.offset;if(z.isInstancedInterleavedBuffer){for(let ge=0;ge<X.locationSize;ge++)m(X.location+ge,z.meshPerAttribute);P.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=z.meshPerAttribute*z.count)}else for(let ge=0;ge<X.locationSize;ge++)g(X.location+ge);n.bindBuffer(n.ARRAY_BUFFER,fe);for(let ge=0;ge<X.locationSize;ge++)w(X.location+ge,he/X.locationSize,re,$,de*pe,(Ee+he/X.locationSize*ge)*pe,k)}else{if(q.isInstancedBufferAttribute){for(let z=0;z<X.locationSize;z++)m(X.location+z,q.meshPerAttribute);P.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let z=0;z<X.locationSize;z++)g(X.location+z);n.bindBuffer(n.ARRAY_BUFFER,fe);for(let z=0;z<X.locationSize;z++)w(X.location+z,he/X.locationSize,re,$,he*pe,he/X.locationSize*z*pe,k)}}else if(O!==void 0){let $=O[te];if($!==void 0)switch($.length){case 2:n.vertexAttrib2fv(X.location,$);break;case 3:n.vertexAttrib3fv(X.location,$);break;case 4:n.vertexAttrib4fv(X.location,$);break;default:n.vertexAttrib1fv(X.location,$)}}}}b()}function _(){S();for(let P in i){let D=i[P];for(let N in D){let I=D[N];for(let U in I){let W=I[U];for(let O in W)u(W[O].object),delete W[O];delete I[U]}}delete i[P]}}function M(P){if(i[P.id]===void 0)return;let D=i[P.id];for(let N in D){let I=D[N];for(let U in I){let W=I[U];for(let O in W)u(W[O].object),delete W[O];delete I[U]}}delete i[P.id]}function A(P){for(let D in i){let N=i[D];for(let I in N){let U=N[I];if(U[P.id]===void 0)continue;let W=U[P.id];for(let O in W)u(W[O].object),delete W[O];delete U[P.id]}}}function v(P){for(let D in i){let N=i[D],I=P.isInstancedMesh===!0?P.id:0,U=N[I];if(U!==void 0){for(let W in U){let O=U[W];for(let te in O)u(O[te].object),delete O[te];delete U[W]}delete N[I],Object.keys(N).length===0&&delete i[D]}}}function S(){C(),o=!0,r!==s&&(r=s,c(r.object))}function C(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:S,resetDefaultState:C,dispose:_,releaseStatesOfGeometry:M,releaseStatesOfObject:v,releaseStatesOfProgram:A,initAttributes:x,enableAttribute:g,disableUnusedAttributes:b}}function lM(n,e,t){let i;function s(l){i=l}function r(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function o(l,c,u){u!==0&&(n.drawArraysInstanced(i,l,c,u),t.update(c,i,u))}function a(l,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,u);let h=0;for(let f=0;f<u;f++)h+=c[f];t.update(h,i,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function cM(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==Ln&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let v=A===Bi&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==ei&&A!==wi&&!v&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(et("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&et("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),b=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),w=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),_=n.getParameter(n.MAX_SAMPLES),M=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:h,maxTextures:f,maxVertexTextures:p,maxTextureSize:x,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:b,maxVaryings:w,maxFragmentUniforms:y,maxSamples:_,samples:M}}function uM(n){let e=this,t=null,i=0,s=!1,r=!1,o=new hi,a=new it,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let f=d.length!==0||h||i!==0||s;return s=h,i=d.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){t=u(d,h,0)},this.setState=function(d,h,f){let p=d.clippingPlanes,x=d.clipIntersection,g=d.clipShadows,m=n.get(d);if(!s||p===null||p.length===0||r&&!g)r?u(null):c();else{let b=r?0:i,w=b*4,y=m.clippingState||null;l.value=y,y=u(p,h,w,f);for(let _=0;_!==w;++_)y[_]=t[_];m.clippingState=y,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(d,h,f,p){let x=d!==null?d.length:0,g=null;if(x!==0){if(g=l.value,p!==!0||g===null){let m=f+x*4,b=h.matrixWorldInverse;a.getNormalMatrix(b),(g===null||g.length<m)&&(g=new Float32Array(m));for(let w=0,y=f;w!==x;++w,y+=4)o.copy(d[w]).applyMatrix4(b,a),o.normal.toArray(g,y),g[y+3]=o.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,g}}var ko=4,hM=6,dM=20,fM=256,Ya=new Ao,i0=new Re,Yd=null,qd=0,$d=0,Zd=!1,pM=new Z,Lr=new Z,Eu=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=pM}=r;Yd=this._renderer.getRenderTarget(),qd=this._renderer.getActiveCubeFace(),$d=this._renderer.getActiveMipmapLevel(),Zd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=o0(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=r0(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Yd,qd,$d),this._renderer.xr.enabled=Zd,e.scissorTest=!1,Do(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===sr||e.mapping===Pr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Yd=this._renderer.getRenderTarget(),qd=this._renderer.getActiveCubeFace(),$d=this._renderer.getActiveMipmapLevel(),Zd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:qt,minFilter:qt,generateMipmaps:!1,type:Bi,format:Ln,colorSpace:xa,depthBuffer:!1},s=s0(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=s0(e,t,i);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=mM(r)),this._blurMaterial=xM(r,e,t),this._ggxMaterial=gM(r,e,t)}return s}_compileMaterial(e){let t=new St(new zt,e);this._renderer.compile(t,Ya)}_sceneToCubeUV(e,t,i,s,r){let l=new Pn(90,1,t,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,h=d.autoClear,f=d.toneMapping;d.getClearColor(i0),d.toneMapping=Oi,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new St(new Qs,new Hn({name:"PMREM.Background",side:Gn,depthWrite:!1,depthTest:!1})));let x=this._backgroundBox,g=x.material,m=!1,b=e.background;b?b.isColor&&(g.color.copy(b),e.background=null,m=!0):(g.color.copy(i0),m=!0);for(let w=0;w<6;w++){let y=w%3;y===0?(l.up.set(0,c[w],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[w],r.y,r.z)):y===1?(l.up.set(0,0,c[w]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[w],r.z)):(l.up.set(0,c[w],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[w]));let _=this._cubeSize;Do(s,y*_,w>2?_:0,_,_),d.setRenderTarget(s),m&&d.render(x,l),d.render(e,l)}d.toneMapping=f,d.autoClear=h,e.background=b}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===sr||e.mapping===Pr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=o0()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=r0());let r=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Do(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Ya)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=i}_applyGGXFilter(e,t,i){let s=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;let l=o.uniforms,c=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),d=Math.sqrt(c*c-u*u),h=c*1.25,f=d*h,{_lodMax:p}=this,x=this._sizeLods[i],g=3*x*(i>p-ko?i-p+ko:0),m=4*(this._cubeSize-x);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=p-t,Do(r,g,m,3*x,2*x),s.setRenderTarget(r),s.render(a,Ya),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=p-i,Do(e,g,m,3*x,2*x),s.setRenderTarget(e),s.render(a,Ya)}_blur(e,t,i,s){let r=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,i,o),this._blurPass(r,e,i,i,o)}_blurPass(e,t,i,s,r){let o=this._renderer,a=this._blurMaterial,l=this._lodMeshes[s];l.material=a;let c=a.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-i;let u=this._sizeLods[s],d=3*u*(s>this._lodMax-ko?s-this._lodMax+ko:0),h=4*(this._cubeSize-u);Do(t,d,h,3*u,2*u),o.setRenderTarget(t),o.render(l,Ya)}};function mM(n){let e=[],t=[],i=n,s=n-ko+1+hM;for(let r=0;r<s;r++){let o=Math.pow(2,i);e.push(o);let a=1/(o-2),l=-a,c=1+a,u=[l,l,c,l,c,c,l,l,c,c,l,c],d=6,h=6,f=3,p=new Float32Array(f*h*d),x=new Float32Array(f*h*d);for(let m=0;m<d;m++){let b=m%3*2/3-1,w=m>2?0:-1,y=[b,w,0,b+2/3,w,0,b+2/3,w+1,0,b,w,0,b+2/3,w+1,0,b,w+1,0];p.set(y,f*h*m);for(let _=0;_<h;_++){let M=u[_*2]*2-1,A=u[_*2+1]*2-1;m===0?Lr.set(1,A,M):m===1?Lr.set(-M,1,-A):m===2?Lr.set(-M,A,1):m===3?Lr.set(-1,A,-M):m===4?Lr.set(-M,-1,A):Lr.set(M,A,-1),Lr.toArray(x,(m*h+_)*f)}}let g=new zt;g.setAttribute("position",new xn(p,f)),g.setAttribute("outputDirection",new xn(x,f)),t.push(new St(g,null)),i>ko&&i--}return{lodMeshes:t,sizeLods:e}}function s0(n,e,t){let i=new Jn(n,e,t);return i.texture.mapping=Oa,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Do(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function gM(n,e,t){return new vn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:fM,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Cu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:is,depthTest:!1,depthWrite:!1})}function xM(n,e,t){return new vn({name:"SphericalGaussianBlur",defines:{SAMPLES:dM,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Cu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:is,depthTest:!1,depthWrite:!1})}function r0(){return new vn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Cu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:is,depthTest:!1,depthWrite:!1})}function o0(){return new vn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Cu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:is,depthTest:!1,depthWrite:!1})}function Cu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Au=class extends Jn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Sa(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Qs(5,5,5),r=new vn({name:"CubemapFromEquirect",uniforms:Ir(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Gn,blending:is});r.uniforms.tEquirect.value=t;let o=new St(s,r),a=t.minFilter;return t.minFilter===Mi&&(t.minFilter=qt),new Lc(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}};function bM(n){let e=new WeakMap,t=new WeakMap,i=null;function s(h,f=!1){return h==null?null:f?o(h):r(h)}function r(h){if(h&&h.isTexture){let f=h.mapping;if(f===Nc||f===Uc)if(e.has(h)){let p=e.get(h).texture;return a(p,h.mapping)}else{let p=h.image;if(p&&p.height>0){let x=new Au(p.height);return x.fromEquirectangularTexture(n,h),e.set(h,x),h.addEventListener("dispose",c),a(x.texture,h.mapping)}else return null}}return h}function o(h){if(h&&h.isTexture){let f=h.mapping,p=f===Nc||f===Uc,x=f===sr||f===Pr;if(p||x){let g=t.get(h),m=g!==void 0?g.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==m)return i===null&&(i=new Eu(n)),g=p?i.fromEquirectangular(h,g):i.fromCubemap(h,g),g.texture.pmremVersion=h.pmremVersion,t.set(h,g),g.texture;if(g!==void 0)return g.texture;{let b=h.image;return p&&b&&b.height>0||x&&b&&l(b)?(i===null&&(i=new Eu(n)),g=p?i.fromEquirectangular(h):i.fromCubemap(h),g.texture.pmremVersion=h.pmremVersion,t.set(h,g),h.addEventListener("dispose",u),g.texture):null}}}return h}function a(h,f){return f===Nc?h.mapping=sr:f===Uc&&(h.mapping=Pr),h}function l(h){let f=0,p=6;for(let x=0;x<p;x++)h[x]!==void 0&&f++;return f===p}function c(h){let f=h.target;f.removeEventListener("dispose",c);let p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function u(h){let f=h.target;f.removeEventListener("dispose",u);let p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:d}}function yM(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s=n.getExtension(i);return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&Ar("WebGLRenderer: "+i+" extension not supported."),s}}}function vM(n,e,t,i){let s={},r=new WeakMap;function o(d){let h=d.target;h.index!==null&&e.remove(h.index);for(let p in h.attributes)e.remove(h.attributes[p]);h.removeEventListener("dispose",o),delete s[h.id];let f=r.get(h);f&&(e.remove(f),r.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function a(d,h){return s[h.id]===!0||(h.addEventListener("dispose",o),s[h.id]=!0,t.memory.geometries++),h}function l(d){let h=d.attributes;for(let f in h)e.update(h[f],n.ARRAY_BUFFER)}function c(d){let h=[],f=d.index,p=d.attributes.position,x=0;if(p===void 0)return;if(f!==null){let b=f.array;x=f.version;for(let w=0,y=b.length;w<y;w+=3){let _=b[w+0],M=b[w+1],A=b[w+2];h.push(_,M,M,A,A,_)}}else{let b=p.array;x=p.version;for(let w=0,y=b.length/3-1;w<y;w+=3){let _=w+0,M=w+1,A=w+2;h.push(_,M,M,A,A,_)}}let g=new(p.count>=65535?Ks:Zs)(h,1);g.version=x;let m=r.get(d);m&&e.remove(m),r.set(d,g)}function u(d){let h=r.get(d);if(h){let f=d.index;f!==null&&h.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:u}}function _M(n,e,t){let i;function s(d){i=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,h){n.drawElements(i,h,r,d*o),t.update(h,i,1)}function c(d,h,f){f!==0&&(n.drawElementsInstanced(i,h,r,d*o,f),t.update(h,i,f))}function u(d,h,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,r,d,0,f);let x=0;for(let g=0;g<f;g++)x+=h[g];t.update(x,i,1)}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function MM(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:tt("WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function wM(n,e,t){let i=new WeakMap,s=new $t;function r(o,a,l){let c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=u!==void 0?u.length:0,h=i.get(a);if(h===void 0||h.count!==d){let S=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",S)};h!==void 0&&h.texture.dispose();let f=a.morphAttributes.position!==void 0,p=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],b=a.morphAttributes.color||[],w=0;f===!0&&(w=1),p===!0&&(w=2),x===!0&&(w=3);let y=a.attributes.position.count*w,_=1;y>e.maxTextureSize&&(_=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let M=new Float32Array(y*_*4*d),A=new va(M,y,_,d);A.type=wi,A.needsUpdate=!0;let v=w*4;for(let C=0;C<d;C++){let P=g[C],D=m[C],N=b[C],I=y*_*4*C;for(let U=0;U<P.count;U++){let W=U*v;f===!0&&(s.fromBufferAttribute(P,U),M[I+W+0]=s.x,M[I+W+1]=s.y,M[I+W+2]=s.z,M[I+W+3]=0),p===!0&&(s.fromBufferAttribute(D,U),M[I+W+4]=s.x,M[I+W+5]=s.y,M[I+W+6]=s.z,M[I+W+7]=0),x===!0&&(s.fromBufferAttribute(N,U),M[I+W+8]=s.x,M[I+W+9]=s.y,M[I+W+10]=s.z,M[I+W+11]=N.itemSize===4?s.w:1)}}h={count:d,texture:A,size:new ft(y,_)},i.set(a,h),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let x=0;x<c.length;x++)f+=c[x];let p=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",p),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:r}}function SM(n,e,t,i,s){let r=new WeakMap;function o(c){let u=s.render.frame,d=c.geometry,h=e.get(c,d);if(r.get(h)!==u&&(e.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==u&&(f.update(),r.set(f,u))}return h}function a(){r=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}var TM={[_d]:"LINEAR_TONE_MAPPING",[Md]:"REINHARD_TONE_MAPPING",[wd]:"CINEON_TONE_MAPPING",[Sd]:"ACES_FILMIC_TONE_MAPPING",[Ed]:"AGX_TONE_MAPPING",[Ua]:"NEUTRAL_TONE_MAPPING",[Td]:"CUSTOM_TONE_MAPPING"};function EM(n,e,t,i,s,r){let o=new Jn(e,t,{type:n,depthBuffer:s,stencilBuffer:r,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,l=null,c=new zt;c.setAttribute("position",new kt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new kt([0,2,0,0,2,0],2));let u=new bc({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new St(c,u),h=new Ao(-1,1,1,-1,0,1),f=null,p=null,x=!1,g,m=null,b=[],w=!1;this.setSize=function(y,_){o.setSize(y,_),a!==null&&a.setSize(y,_),l!==null&&l.setSize(y,_);for(let M=0;M<b.length;M++){let A=b[M];A.setSize&&A.setSize(y,_)}},this.setEffects=function(y){b=y,w=b.length>0&&b[0].isRenderPass===!0;let _=o.width,M=o.height;b.length>0&&a===null&&(a=new Jn(_,M,{type:Bi,depthBuffer:!1,stencilBuffer:!1}),l=new Jn(_,M,{type:Bi,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<b.length;A++){let v=b[A];v.setSize&&v.setSize(_,M)}},this.begin=function(y,_){if(x||y.toneMapping===Oi&&b.length===0)return!1;if(m=_,_!==null){let M=_.width,A=_.height;(o.width!==M||o.height!==A)&&this.setSize(M,A)}return w===!1&&y.setRenderTarget(o),g=y.toneMapping,y.toneMapping=Oi,!0},this.hasRenderPass=function(){return w},this.end=function(y,_){y.toneMapping=g,x=!0;let M=o,A=a;for(let v=0;v<b.length;v++){let S=b[v];S.enabled!==!1&&(S.render(y,A,M,_),S.needsSwap!==!1&&(M=A,A=A===a?l:a))}if(f!==y.outputColorSpace||p!==y.toneMapping){f=y.outputColorSpace,p=y.toneMapping,u.defines={},bt.getTransfer(f)===Lt&&(u.defines.SRGB_TRANSFER="");let v=TM[p];v&&(u.defines[v]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=M.texture,y.setRenderTarget(m),y.render(d,h),m=null,x=!1},this.isCompositing=function(){return x},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}var E0=new zn,jd=new js(1,1),A0=new va,R0=new gc,C0=new Sa,a0=[],l0=[],c0=new Float32Array(16),u0=new Float32Array(9),h0=new Float32Array(4);function Uo(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=a0[s];if(r===void 0&&(r=new Float32Array(s),a0[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function hn(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function dn(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Pu(n,e){let t=l0[e];t===void 0&&(t=new Int32Array(e),l0[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function AM(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function RM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(hn(t,e))return;n.uniform2fv(this.addr,e),dn(t,e)}}function CM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(hn(t,e))return;n.uniform3fv(this.addr,e),dn(t,e)}}function PM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(hn(t,e))return;n.uniform4fv(this.addr,e),dn(t,e)}}function IM(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(hn(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),dn(t,e)}else{if(hn(t,i))return;h0.set(i),n.uniformMatrix2fv(this.addr,!1,h0),dn(t,i)}}function LM(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(hn(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),dn(t,e)}else{if(hn(t,i))return;u0.set(i),n.uniformMatrix3fv(this.addr,!1,u0),dn(t,i)}}function DM(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(hn(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),dn(t,e)}else{if(hn(t,i))return;c0.set(i),n.uniformMatrix4fv(this.addr,!1,c0),dn(t,i)}}function kM(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function NM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(hn(t,e))return;n.uniform2iv(this.addr,e),dn(t,e)}}function UM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(hn(t,e))return;n.uniform3iv(this.addr,e),dn(t,e)}}function OM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(hn(t,e))return;n.uniform4iv(this.addr,e),dn(t,e)}}function FM(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function BM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(hn(t,e))return;n.uniform2uiv(this.addr,e),dn(t,e)}}function zM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(hn(t,e))return;n.uniform3uiv(this.addr,e),dn(t,e)}}function HM(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(hn(t,e))return;n.uniform4uiv(this.addr,e),dn(t,e)}}function GM(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(jd.compareFunction=t.isReversedDepthBuffer()?Mu:_u,r=jd):r=E0,t.setTexture2D(e||r,s)}function VM(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||R0,s)}function WM(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||C0,s)}function XM(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||A0,s)}function YM(n){switch(n){case 5126:return AM;case 35664:return RM;case 35665:return CM;case 35666:return PM;case 35674:return IM;case 35675:return LM;case 35676:return DM;case 5124:case 35670:return kM;case 35667:case 35671:return NM;case 35668:case 35672:return UM;case 35669:case 35673:return OM;case 5125:return FM;case 36294:return BM;case 36295:return zM;case 36296:return HM;case 35678:case 36198:case 36298:case 36306:case 35682:return GM;case 35679:case 36299:case 36307:return VM;case 35680:case 36300:case 36308:case 36293:return WM;case 36289:case 36303:case 36311:case 36292:return XM}}function qM(n,e){n.uniform1fv(this.addr,e)}function $M(n,e){let t=Uo(e,this.size,2);n.uniform2fv(this.addr,t)}function ZM(n,e){let t=Uo(e,this.size,3);n.uniform3fv(this.addr,t)}function KM(n,e){let t=Uo(e,this.size,4);n.uniform4fv(this.addr,t)}function JM(n,e){let t=Uo(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function jM(n,e){let t=Uo(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function QM(n,e){let t=Uo(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function ew(n,e){n.uniform1iv(this.addr,e)}function tw(n,e){n.uniform2iv(this.addr,e)}function nw(n,e){n.uniform3iv(this.addr,e)}function iw(n,e){n.uniform4iv(this.addr,e)}function sw(n,e){n.uniform1uiv(this.addr,e)}function rw(n,e){n.uniform2uiv(this.addr,e)}function ow(n,e){n.uniform3uiv(this.addr,e)}function aw(n,e){n.uniform4uiv(this.addr,e)}function lw(n,e,t){let i=this.cache,s=e.length,r=Pu(t,s);hn(i,r)||(n.uniform1iv(this.addr,r),dn(i,r));let o;this.type===n.SAMPLER_2D_SHADOW?o=jd:o=E0;for(let a=0;a!==s;++a)t.setTexture2D(e[a]||o,r[a])}function cw(n,e,t){let i=this.cache,s=e.length,r=Pu(t,s);hn(i,r)||(n.uniform1iv(this.addr,r),dn(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||R0,r[o])}function uw(n,e,t){let i=this.cache,s=e.length,r=Pu(t,s);hn(i,r)||(n.uniform1iv(this.addr,r),dn(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||C0,r[o])}function hw(n,e,t){let i=this.cache,s=e.length,r=Pu(t,s);hn(i,r)||(n.uniform1iv(this.addr,r),dn(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||A0,r[o])}function dw(n){switch(n){case 5126:return qM;case 35664:return $M;case 35665:return ZM;case 35666:return KM;case 35674:return JM;case 35675:return jM;case 35676:return QM;case 5124:case 35670:return ew;case 35667:case 35671:return tw;case 35668:case 35672:return nw;case 35669:case 35673:return iw;case 5125:return sw;case 36294:return rw;case 36295:return ow;case 36296:return aw;case 35678:case 36198:case 36298:case 36306:case 35682:return lw;case 35679:case 36299:case 36307:return cw;case 35680:case 36300:case 36308:case 36293:return uw;case 36289:case 36303:case 36311:case 36292:return hw}}var Qd=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=YM(t.type)}},ef=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=dw(t.type)}},tf=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Kd=/(\w+)(\])?(\[|\.)?/g;function d0(n,e){n.seq.push(e),n.map[e.id]=e}function fw(n,e,t){let i=n.name,s=i.length;for(Kd.lastIndex=0;;){let r=Kd.exec(i),o=Kd.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){d0(t,c===void 0?new Qd(a,n,e):new ef(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new tf(a),d0(t,d)),t=d}}}var No=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=e.getActiveUniform(t,o),l=e.getUniformLocation(t,a.name);fw(a,l,this)}let s=[],r=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function f0(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var pw=37297,mw=0;function gw(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var p0=new it;function xw(n){bt._getMatrix(p0,bt.workingColorSpace,n);let e=`mat3( ${p0.elements.map(t=>t.toFixed(4))} )`;switch(bt.getTransfer(n)){case ba:return[e,"LinearTransferOETF"];case Lt:return[e,"sRGBTransferOETF"];default:return et("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function m0(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=(n.getShaderInfoLog(e)||"").trim();if(i&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+gw(n.getShaderSource(e),a)}else return r}function bw(n,e){let t=xw(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var yw={[_d]:"Linear",[Md]:"Reinhard",[wd]:"Cineon",[Sd]:"ACESFilmic",[Ed]:"AgX",[Ua]:"Neutral",[Td]:"Custom"};function vw(n,e){let t=yw[e];return t===void 0?(et("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Tu=new Z;function _w(){bt.getLuminanceCoefficients(Tu);let n=Tu.x.toFixed(4),e=Tu.y.toFixed(4),t=Tu.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Mw(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter($a).join(`
`)}function ww(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Sw(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function $a(n){return n!==""}function g0(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function x0(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Tw=/^[ \t]*#include +<([\w\d./]+)>/gm;function nf(n){return n.replace(Tw,Aw)}var Ew=new Map;function Aw(n,e){let t=ht[e];if(t===void 0){let i=Ew.get(e);if(i!==void 0)t=ht[i],et('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return nf(t)}var Rw=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function b0(n){return n.replace(Rw,Cw)}function Cw(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function y0(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var Pw={[Rr]:"SHADOWMAP_TYPE_PCF",[Ro]:"SHADOWMAP_TYPE_VSM"};function Iw(n){return Pw[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Lw={[sr]:"ENVMAP_TYPE_CUBE",[Pr]:"ENVMAP_TYPE_CUBE",[Oa]:"ENVMAP_TYPE_CUBE_UV"};function Dw(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Lw[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var kw={[Pr]:"ENVMAP_MODE_REFRACTION"};function Nw(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":kw[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Uw={[Na]:"ENVMAP_BLENDING_MULTIPLY",[Um]:"ENVMAP_BLENDING_MIX",[Om]:"ENVMAP_BLENDING_ADD"};function Ow(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Uw[n.combine]||"ENVMAP_BLENDING_NONE"}function Fw(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Bw(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=Iw(t),c=Dw(t),u=Nw(t),d=Ow(t),h=Fw(t),f=Mw(t),p=ww(r),x=s.createProgram(),g,m,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter($a).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter($a).join(`
`),m.length>0&&(m+=`
`)):(g=[y0(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter($a).join(`
`),m=[y0(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Oi?"#define TONE_MAPPING":"",t.toneMapping!==Oi?ht.tonemapping_pars_fragment:"",t.toneMapping!==Oi?vw("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ht.colorspace_pars_fragment,bw("linearToOutputTexel",t.outputColorSpace),_w(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter($a).join(`
`)),o=nf(o),o=g0(o,t),o=x0(o,t),a=nf(a),a=g0(a,t),a=x0(a,t),o=b0(o),a=b0(a),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",t.glslVersion===kd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===kd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let w=b+g+o,y=b+m+a,_=f0(s,s.VERTEX_SHADER,w),M=f0(s,s.FRAGMENT_SHADER,y);s.attachShader(x,_),s.attachShader(x,M),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function A(P){if(n.debug.checkShaderErrors){let D=s.getProgramInfoLog(x)||"",N=s.getShaderInfoLog(_)||"",I=s.getShaderInfoLog(M)||"",U=D.trim(),W=N.trim(),O=I.trim(),te=!0,X=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(te=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,x,_,M);else{let q=m0(s,_,"vertex"),$=m0(s,M,"fragment");tt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+U+`
`+q+`
`+$)}else U!==""?et("WebGLProgram: Program Info Log:",U):(W===""||O==="")&&(X=!1);X&&(P.diagnostics={runnable:te,programLog:U,vertexShader:{log:W,prefix:g},fragmentShader:{log:O,prefix:m}})}s.deleteShader(_),s.deleteShader(M),v=new No(s,x),S=Sw(s,x)}let v;this.getUniforms=function(){return v===void 0&&A(this),v};let S;this.getAttributes=function(){return S===void 0&&A(this),S};let C=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return C===!1&&(C=s.getProgramParameter(x,pw)),C},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=mw++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=_,this.fragmentShader=M,this}var zw=0,sf=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new rf(e),t.set(e,i)),i}},rf=class{constructor(e){this.id=zw++,this.code=e,this.usedTimes=0}};function Hw(n){return n===or||n===Va||n===Wa}function Gw(n,e,t,i,s,r){let o=new So,a=new sf,l=new Set,c=[],u=new Map,d=i.logarithmicDepthBuffer,h=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(v){return l.add(v),v===0?"uv":`uv${v}`}function x(v,S,C,P,D,N){let I=P.fog,U=D.geometry,W=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?P.environment:null,O=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,te=e.get(v.envMap||W,O),X=te&&te.mapping===Oa?te.image.height:null,q=f[v.type];v.precision!==null&&(h=i.getMaxPrecision(v.precision),h!==v.precision&&et("WebGLProgram.getParameters:",v.precision,"not supported, using",h,"instead."));let $=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,he=$!==void 0?$.length:0,Q=0;U.morphAttributes.position!==void 0&&(Q=1),U.morphAttributes.normal!==void 0&&(Q=2),U.morphAttributes.color!==void 0&&(Q=3);let fe,re,pe,k;if(q){let Ct=rs[q];fe=Ct.vertexShader,re=Ct.fragmentShader}else{fe=v.vertexShader,re=v.fragmentShader;let Ct=a.getVertexShaderStage(v),pt=a.getFragmentShaderStage(v);a.update(v,Ct,pt),pe=Ct.id,k=pt.id}let z=n.getRenderTarget(),de=n.state.buffers.depth.getReversed(),Ee=D.isInstancedMesh===!0,ge=D.isBatchedMesh===!0,Ue=!!v.map,vt=!!v.matcap,G=!!te,me=!!v.aoMap,ke=!!v.lightMap,xe=!!v.bumpMap&&v.wireframe===!1,Ve=!!v.normalMap,Je=!!v.displacementMap,dt=!!v.emissiveMap,_t=!!v.metalnessMap,Dt=!!v.roughnessMap,V=v.anisotropy>0,on=v.clearcoat>0,At=v.dispersion>0,L=v.retroreflectivity>0,T=v.iridescence>0,Y=v.sheen>0,ee=v.transmission>0,ie=V&&!!v.anisotropyMap,ye=on&&!!v.clearcoatMap,_e=on&&!!v.clearcoatNormalMap,se=on&&!!v.clearcoatRoughnessMap,oe=T&&!!v.iridescenceMap,Me=T&&!!v.iridescenceThicknessMap,Ye=Y&&!!v.sheenColorMap,Ae=Y&&!!v.sheenRoughnessMap,we=!!v.specularMap,Xe=!!v.specularColorMap,je=!!v.specularIntensityMap,rt=ee&&!!v.transmissionMap,H=ee&&!!v.thicknessMap,Se=!!v.gradientMap,ce=!!v.alphaMap,Te=v.alphaTest>0,Ce=!!v.alphaHash,ae=!!v.extensions,Be=Oi;v.toneMapped&&(z===null||z.isXRRenderTarget===!0)&&(Be=n.toneMapping);let Oe={shaderID:q,shaderType:v.type,shaderName:v.name,vertexShader:fe,fragmentShader:re,defines:v.defines,customVertexShaderID:pe,customFragmentShaderID:k,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:h,batching:ge,batchingColor:ge&&D._colorsTexture!==null,instancing:Ee,instancingColor:Ee&&D.instanceColor!==null,instancingMorph:Ee&&D.morphTexture!==null,outputColorSpace:z===null?n.outputColorSpace:z.isXRRenderTarget===!0?z.texture.colorSpace:bt.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Ue,matcap:vt,envMap:G,envMapMode:G&&te.mapping,envMapCubeUVHeight:X,aoMap:me,lightMap:ke,bumpMap:xe,normalMap:Ve,displacementMap:Je,emissiveMap:dt,normalMapObjectSpace:Ve&&v.normalMapType===zm,normalMapTangentSpace:Ve&&v.normalMapType===Xa,packedNormalMap:Ve&&v.normalMapType===Xa&&Hw(v.normalMap.format),metalnessMap:_t,roughnessMap:Dt,anisotropy:V,anisotropyMap:ie,clearcoat:on,clearcoatMap:ye,clearcoatNormalMap:_e,clearcoatRoughnessMap:se,dispersion:At,retroreflection:L,iridescence:T,iridescenceMap:oe,iridescenceThicknessMap:Me,sheen:Y,sheenColorMap:Ye,sheenRoughnessMap:Ae,specularMap:we,specularColorMap:Xe,specularIntensityMap:je,transmission:ee,transmissionMap:rt,thicknessMap:H,gradientMap:Se,opaque:v.transparent===!1&&v.blending===Co&&v.alphaToCoverage===!1,alphaMap:ce,alphaTest:Te,alphaHash:Ce,combine:v.combine,mapUv:Ue&&p(v.map.channel),aoMapUv:me&&p(v.aoMap.channel),lightMapUv:ke&&p(v.lightMap.channel),bumpMapUv:xe&&p(v.bumpMap.channel),normalMapUv:Ve&&p(v.normalMap.channel),displacementMapUv:Je&&p(v.displacementMap.channel),emissiveMapUv:dt&&p(v.emissiveMap.channel),metalnessMapUv:_t&&p(v.metalnessMap.channel),roughnessMapUv:Dt&&p(v.roughnessMap.channel),anisotropyMapUv:ie&&p(v.anisotropyMap.channel),clearcoatMapUv:ye&&p(v.clearcoatMap.channel),clearcoatNormalMapUv:_e&&p(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:se&&p(v.clearcoatRoughnessMap.channel),iridescenceMapUv:oe&&p(v.iridescenceMap.channel),iridescenceThicknessMapUv:Me&&p(v.iridescenceThicknessMap.channel),sheenColorMapUv:Ye&&p(v.sheenColorMap.channel),sheenRoughnessMapUv:Ae&&p(v.sheenRoughnessMap.channel),specularMapUv:we&&p(v.specularMap.channel),specularColorMapUv:Xe&&p(v.specularColorMap.channel),specularIntensityMapUv:je&&p(v.specularIntensityMap.channel),transmissionMapUv:rt&&p(v.transmissionMap.channel),thicknessMapUv:H&&p(v.thicknessMap.channel),alphaMapUv:ce&&p(v.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(Ve||V),vertexNormals:!!U.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!U.attributes.uv&&(Ue||ce),fog:!!I,useFog:v.fog===!0,fogExp2:!!I&&I.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||U.attributes.normal===void 0&&Ve===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:de,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:U.attributes.position!==void 0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:he,morphTextureStride:Q,numSunLights:S.sun.length,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numSunLightShadows:S.sunShadowMap.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:N.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:v.dithering,shadowMapEnabled:n.shadowMap.enabled&&C.length>0,shadowMapType:n.shadowMap.type,toneMapping:Be,decodeVideoTexture:Ue&&v.map.isVideoTexture===!0&&bt.getTransfer(v.map.colorSpace)===Lt,decodeVideoTextureEmissive:dt&&v.emissiveMap.isVideoTexture===!0&&bt.getTransfer(v.emissiveMap.colorSpace)===Lt,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Vn,flipSided:v.side===Gn,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:ae&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&v.extensions.multiDraw===!0||ge)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Oe.vertexUv1s=l.has(1),Oe.vertexUv2s=l.has(2),Oe.vertexUv3s=l.has(3),l.clear(),Oe}function g(v){let S=[];if(v.shaderID?S.push(v.shaderID):(S.push(v.customVertexShaderID),S.push(v.customFragmentShaderID)),v.defines!==void 0)for(let C in v.defines)S.push(C),S.push(v.defines[C]);return v.isRawShaderMaterial===!1&&(m(S,v),b(S,v),S.push(n.outputColorSpace)),S.push(v.customProgramCacheKey),S.join()}function m(v,S){v.push(S.precision),v.push(S.outputColorSpace),v.push(S.envMapMode),v.push(S.envMapCubeUVHeight),v.push(S.mapUv),v.push(S.alphaMapUv),v.push(S.lightMapUv),v.push(S.aoMapUv),v.push(S.bumpMapUv),v.push(S.normalMapUv),v.push(S.displacementMapUv),v.push(S.emissiveMapUv),v.push(S.metalnessMapUv),v.push(S.roughnessMapUv),v.push(S.anisotropyMapUv),v.push(S.clearcoatMapUv),v.push(S.clearcoatNormalMapUv),v.push(S.clearcoatRoughnessMapUv),v.push(S.iridescenceMapUv),v.push(S.iridescenceThicknessMapUv),v.push(S.sheenColorMapUv),v.push(S.sheenRoughnessMapUv),v.push(S.specularMapUv),v.push(S.specularColorMapUv),v.push(S.specularIntensityMapUv),v.push(S.transmissionMapUv),v.push(S.thicknessMapUv),v.push(S.combine),v.push(S.fogExp2),v.push(S.sizeAttenuation),v.push(S.morphTargetsCount),v.push(S.morphAttributeCount),v.push(S.numSunLights),v.push(S.numDirLights),v.push(S.numPointLights),v.push(S.numSpotLights),v.push(S.numSpotLightMaps),v.push(S.numHemiLights),v.push(S.numRectAreaLights),v.push(S.numSunLightShadows),v.push(S.numDirLightShadows),v.push(S.numPointLightShadows),v.push(S.numSpotLightShadows),v.push(S.numSpotLightShadowsWithMaps),v.push(S.numLightProbes),v.push(S.shadowMapType),v.push(S.toneMapping),v.push(S.numClippingPlanes),v.push(S.numClipIntersection),v.push(S.depthPacking)}function b(v,S){o.disableAll(),S.instancing&&o.enable(0),S.instancingColor&&o.enable(1),S.instancingMorph&&o.enable(2),S.matcap&&o.enable(3),S.envMap&&o.enable(4),S.normalMapObjectSpace&&o.enable(5),S.normalMapTangentSpace&&o.enable(6),S.clearcoat&&o.enable(7),S.iridescence&&o.enable(8),S.alphaTest&&o.enable(9),S.vertexColors&&o.enable(10),S.vertexAlphas&&o.enable(11),S.vertexUv1s&&o.enable(12),S.vertexUv2s&&o.enable(13),S.vertexUv3s&&o.enable(14),S.vertexTangents&&o.enable(15),S.anisotropy&&o.enable(16),S.alphaHash&&o.enable(17),S.batching&&o.enable(18),S.dispersion&&o.enable(19),S.retroreflection&&o.enable(24),S.batchingColor&&o.enable(20),S.gradientMap&&o.enable(21),S.packedNormalMap&&o.enable(22),S.vertexNormals&&o.enable(23),v.push(o.mask),o.disableAll(),S.fog&&o.enable(0),S.useFog&&o.enable(1),S.flatShading&&o.enable(2),S.logarithmicDepthBuffer&&o.enable(3),S.reversedDepthBuffer&&o.enable(4),S.skinning&&o.enable(5),S.morphTargets&&o.enable(6),S.morphNormals&&o.enable(7),S.morphColors&&o.enable(8),S.premultipliedAlpha&&o.enable(9),S.shadowMapEnabled&&o.enable(10),S.doubleSided&&o.enable(11),S.flipSided&&o.enable(12),S.useDepthPacking&&o.enable(13),S.dithering&&o.enable(14),S.transmission&&o.enable(15),S.sheen&&o.enable(16),S.opaque&&o.enable(17),S.pointsUvs&&o.enable(18),S.decodeVideoTexture&&o.enable(19),S.decodeVideoTextureEmissive&&o.enable(20),S.alphaToCoverage&&o.enable(21),S.numLightProbeGrids>0&&o.enable(22),S.hasPositionAttribute&&o.enable(23),v.push(o.mask)}function w(v){let S=f[v.type],C;if(S){let P=rs[S];C=e0.clone(P.uniforms)}else C=v.uniforms;return C}function y(v,S){let C=u.get(S);return C!==void 0?++C.usedTimes:(C=new Bw(n,S,v,s),c.push(C),u.set(S,C)),C}function _(v){if(--v.usedTimes===0){let S=c.indexOf(v);c[S]=c[c.length-1],c.pop(),u.delete(v.cacheKey),v.destroy()}}function M(v){a.remove(v)}function A(){a.dispose()}return{getParameters:x,getProgramCacheKey:g,getUniforms:w,acquireProgram:y,releaseProgram:_,releaseShaderCache:M,programs:c,dispose:A}}function Vw(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function Ww(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function v0(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function _0(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(h){let f=0;return h.isInstancedMesh&&(f+=2),h.isSkinnedMesh&&(f+=1),f}function a(h,f,p,x,g,m){let b=n[e];return b===void 0?(b={id:h.id,object:h,geometry:f,material:p,materialVariant:o(h),groupOrder:x,renderOrder:h.renderOrder,z:g,group:m},n[e]=b):(b.id=h.id,b.object=h,b.geometry=f,b.material=p,b.materialVariant=o(h),b.groupOrder=x,b.renderOrder=h.renderOrder,b.z=g,b.group=m),e++,b}function l(h,f,p,x,g,m,b){b.reversedDepth===!0&&(g=-g);let w=a(h,f,p,x,g,m);p.transmission>0?i.push(w):p.transparent===!0?s.push(w):t.push(w)}function c(h,f,p,x,g,m){let b=a(h,f,p,x,g,m);p.transmission>0?i.unshift(b):p.transparent===!0?s.unshift(b):t.unshift(b)}function u(h,f){t.length>1&&t.sort(h||Ww),i.length>1&&i.sort(f||v0),s.length>1&&s.sort(f||v0)}function d(){for(let h=e,f=n.length;h<f;h++){let p=n[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:l,unshift:c,finish:d,sort:u}}function Xw(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new _0,n.set(i,[o])):s>=r.length?(o=new _0,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Yw(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new Z,color:new Re};break;case"SpotLight":t={position:new Z,direction:new Z,color:new Re,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new Z,color:new Re,distance:0,decay:0};break;case"HemisphereLight":t={direction:new Z,skyColor:new Re,groundColor:new Re};break;case"RectAreaLight":t={color:new Re,position:new Z,halfWidth:new Z,halfHeight:new Z};break}return n[e.id]=t,t}}}function qw(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var $w=0;function Zw(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Kw(n){let e=new Yw,t=qw(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new Z);let s=new Z,r=new gt,o=new gt;function a(c){let u=0,d=0,h=0;for(let D=0;D<9;D++)i.probe[D].set(0,0,0);let f=0,p=0,x=0,g=0,m=0,b=0,w=0,y=0,_=0,M=0,A=0,v=0,S=0,C=0;c.sort(Zw);for(let D=0,N=c.length;D<N;D++){let I=c[D],U=I.color,W=I.intensity,O=I.distance,te=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===or?te=I.shadow.map.texture:te=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)u+=U.r*W,d+=U.g*W,h+=U.b*W;else if(I.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(I.sh.coefficients[X],W);C++}else if(I.isSunLight){let X=e.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let q=I.shadow,$=t.get(I);$.shadowIntensity=q.intensity,$.shadowBias=q.bias,$.shadowNormalBias=q.normalBias,$.shadowRadius=q.radius,$.shadowMapSize.copy(q.mapSize).multiply(q.getFrameExtents()),i.sunShadow[p]=$,i.sunShadowMap[p]=te;let he=q.getViewportCount();for(let Q=0;Q<he;Q++)i.sunShadowMatrix[x+Q]=q.getMatrix(Q),i.sunShadowCascade[x+Q]=q._cascadeData[Q];x+=he,p++}i.sun[f]=X,f++}else if(I.isDirectionalLight){let X=e.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let q=I.shadow,$=t.get(I);$.shadowIntensity=q.intensity,$.shadowBias=q.bias,$.shadowNormalBias=q.normalBias,$.shadowRadius=q.radius,$.shadowMapSize=q.mapSize,i.directionalShadow[g]=$,i.directionalShadowMap[g]=te,i.directionalShadowMatrix[g]=I.shadow.matrix,_++}i.directional[g]=X,g++}else if(I.isSpotLight){let X=e.get(I);X.position.setFromMatrixPosition(I.matrixWorld),X.color.copy(U).multiplyScalar(W),X.distance=O,X.coneCos=Math.cos(I.angle),X.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),X.decay=I.decay,i.spot[b]=X;let q=I.shadow;if(I.map&&(i.spotLightMap[v]=I.map,v++,q.updateMatrices(I),I.castShadow&&S++),i.spotLightMatrix[b]=q.matrix,I.castShadow){let $=t.get(I);$.shadowIntensity=q.intensity,$.shadowBias=q.bias,$.shadowNormalBias=q.normalBias,$.shadowRadius=q.radius,$.shadowMapSize=q.mapSize,i.spotShadow[b]=$,i.spotShadowMap[b]=te,A++}b++}else if(I.isRectAreaLight){let X=e.get(I);X.color.copy(U).multiplyScalar(W),X.halfWidth.set(I.width*.5,0,0),X.halfHeight.set(0,I.height*.5,0),i.rectArea[w]=X,w++}else if(I.isPointLight){let X=e.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),X.distance=I.distance,X.decay=I.decay,I.castShadow){let q=I.shadow,$=t.get(I);$.shadowIntensity=q.intensity,$.shadowBias=q.bias,$.shadowNormalBias=q.normalBias,$.shadowRadius=q.radius,$.shadowMapSize=q.mapSize,$.shadowCameraNear=q.camera.near,$.shadowCameraFar=q.camera.far,i.pointShadow[m]=$,i.pointShadowMap[m]=te,i.pointShadowMatrix[m]=I.shadow.matrix,M++}i.point[m]=X,m++}else if(I.isHemisphereLight){let X=e.get(I);X.skyColor.copy(I.color).multiplyScalar(W),X.groundColor.copy(I.groundColor).multiplyScalar(W),i.hemi[y]=X,y++}}w>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Pe.LTC_FLOAT_1,i.rectAreaLTC2=Pe.LTC_FLOAT_2):(i.rectAreaLTC1=Pe.LTC_HALF_1,i.rectAreaLTC2=Pe.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=d,i.ambient[2]=h;let P=i.hash;(P.sunLength!==f||P.directionalLength!==g||P.pointLength!==m||P.spotLength!==b||P.rectAreaLength!==w||P.hemiLength!==y||P.numSunShadows!==p||P.numDirectionalShadows!==_||P.numPointShadows!==M||P.numSpotShadows!==A||P.numSpotMaps!==v||P.numLightProbes!==C)&&(i.sun.length=f,i.directional.length=g,i.spot.length=b,i.rectArea.length=w,i.point.length=m,i.hemi.length=y,i.sunShadow.length=p,i.sunShadowMap.length=p,i.sunShadowMatrix.length=x,i.sunShadowCascade.length=x,i.directionalShadow.length=_,i.directionalShadowMap.length=_,i.directionalShadowMatrix.length=_,i.pointShadow.length=M,i.pointShadowMap.length=M,i.pointShadowMatrix.length=M,i.spotShadow.length=A,i.spotShadowMap.length=A,i.spotLightMatrix.length=A+v-S,i.spotLightMap.length=v,i.numSpotLightShadowsWithMaps=S,i.numLightProbes=C,P.sunLength=f,P.directionalLength=g,P.pointLength=m,P.spotLength=b,P.rectAreaLength=w,P.hemiLength=y,P.numSunShadows=p,P.numDirectionalShadows=_,P.numPointShadows=M,P.numSpotShadows=A,P.numSpotMaps=v,P.numLightProbes=C,i.version=$w++)}function l(c,u){let d=0,h=0,f=0,p=0,x=0,g=0,m=u.matrixWorldInverse;for(let b=0,w=c.length;b<w;b++){let y=c[b];if(y.isSunLight){let _=i.sun[d];_.direction.setFromMatrixPosition(y.matrixWorld),_.direction.transformDirection(m),d++}else if(y.isDirectionalLight){let _=i.directional[h];_.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),h++}else if(y.isSpotLight){let _=i.spot[p];_.position.setFromMatrixPosition(y.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),p++}else if(y.isRectAreaLight){let _=i.rectArea[x];_.position.setFromMatrixPosition(y.matrixWorld),_.position.applyMatrix4(m),o.identity(),r.copy(y.matrixWorld),r.premultiply(m),o.extractRotation(r),_.halfWidth.set(y.width*.5,0,0),_.halfHeight.set(0,y.height*.5,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),x++}else if(y.isPointLight){let _=i.point[f];_.position.setFromMatrixPosition(y.matrixWorld),_.position.applyMatrix4(m),f++}else if(y.isHemisphereLight){let _=i.hemi[g];_.direction.setFromMatrixPosition(y.matrixWorld),_.direction.transformDirection(m),g++}}}return{setup:a,setupView:l,state:i}}function M0(n){let e=new Kw(n),t=[],i=[],s=[];function r(h){d.camera=h,t.length=0,i.length=0,s.length=0}function o(h){t.push(h)}function a(h){i.push(h)}function l(h){s.push(h)}function c(){e.setup(t)}function u(h){e.setupView(t,h)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:c,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:l}}function Jw(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new M0(n),e.set(s,[a])):r>=o.length?(a=new M0(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var jw=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Qw=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,e2=[new Z(1,0,0),new Z(-1,0,0),new Z(0,1,0),new Z(0,-1,0),new Z(0,0,1),new Z(0,0,-1)],t2=[new Z(0,-1,0),new Z(0,-1,0),new Z(0,0,1),new Z(0,0,-1),new Z(0,-1,0),new Z(0,-1,0)],w0=new gt,qa=new Z,Jd=new Z;function n2(n,e,t){let i=new Eo,s=new ft,r=new ft,o=new $t,a=new yc,l=new vc,c={},u=t.maxTextureSize,d={[ir]:Gn,[Gn]:ir,[Vn]:Vn},h=new vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ft},radius:{value:4}},vertexShader:jw,fragmentShader:Qw}),f=h.clone();f.defines.HORIZONTAL_PASS=1;let p=new zt;p.setAttribute("position",new xn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new St(p,h),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Rr;let m=this.type;this.render=function(M,A,v){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||M.length===0)return;this.type===xm&&(et("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Rr);let S=n.getRenderTarget(),C=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),D=n.state;D.setBlending(is),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let N=m!==this.type;N&&A.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(U=>U.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,U=M.length;I<U;I++){let W=M[I],O=W.shadow;if(O===void 0){et("WebGLShadowMap:",W,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;s.copy(O.mapSize);let te=O.getFrameExtents();s.multiply(te),r.copy(O.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/te.x),s.x=r.x*te.x,O.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/te.y),s.y=r.y*te.y,O.mapSize.y=r.y));let X=n.state.buffers.depth.getReversed();if(O.camera._reversedDepth=X,O.map===null||N===!0){if(O.map!==null&&(O.map.depthTexture!==null&&(O.map.depthTexture.dispose(),O.map.depthTexture=null),O.map.dispose()),this.type===Ro){if(W.isPointLight){et("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}O.map=new Jn(s.x,s.y,{format:or,type:Bi,minFilter:qt,magFilter:qt,generateMipmaps:!1}),O.map.texture.name=W.name+".shadowMap",O.map.depthTexture=new js(s.x,s.y,wi),O.map.depthTexture.name=W.name+".shadowMapDepth",O.map.depthTexture.format=ji,O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=Kt,O.map.depthTexture.magFilter=Kt}else W.isPointLight?(O.map=new Au(s.x),O.map.depthTexture=new xc(s.x,Fi)):(O.map=new Jn(s.x,s.y),O.map.depthTexture=new js(s.x,s.y,Fi)),O.map.depthTexture.name=W.name+".shadowMap",O.map.depthTexture.format=ji,this.type===Rr?(O.map.depthTexture.compareFunction=X?Mu:_u,O.map.depthTexture.minFilter=qt,O.map.depthTexture.magFilter=qt):(O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=Kt,O.map.depthTexture.magFilter=Kt);O.camera.updateProjectionMatrix()}O.map.isWebGLCubeRenderTarget!==!0&&(O.map.width!==s.x||O.map.height!==s.y)&&O.map.setSize(s.x,s.y);let q=O.map.isWebGLCubeRenderTarget?6:O.getViewportCount();W.isPointLight!==!0&&O.updateMatrices(W,v);for(let $=0;$<q;$++){let he=O.getCamera($);if(W.isPointLight){let Q=O.camera,fe=O.matrix,re=W.distance||Q.far;re!==Q.far&&(Q.far=re,Q.updateProjectionMatrix()),qa.setFromMatrixPosition(W.matrixWorld),Q.position.copy(qa),Jd.copy(Q.position),Jd.add(e2[$]),Q.up.copy(t2[$]),Q.lookAt(Jd),Q.updateMatrixWorld(),fe.makeTranslation(-qa.x,-qa.y,-qa.z),w0.multiplyMatrices(Q.projectionMatrix,Q.matrixWorldInverse),O._frustum.setFromProjectionMatrix(w0,Q.coordinateSystem,Q.reversedDepth)}if(O.map.isWebGLCubeRenderTarget)n.setRenderTarget(O.map,$),n.clear();else{$===0&&(n.setRenderTarget(O.map),n.clear());let Q=O.getViewport($);o.set(r.x*Q.x,r.y*Q.y,r.x*Q.z,r.y*Q.w),D.viewport(o)}i=O.getFrustum($),y(A,v,he,W,this.type)}O.isPointLightShadow!==!0&&this.type===Ro&&b(O,v),O.needsUpdate=!1}m=this.type,g.needsUpdate=!1,n.setRenderTarget(S,C,P)};function b(M,A){let v=e.update(x);h.defines.VSM_SAMPLES!==M.blurSamples&&(h.defines.VSM_SAMPLES=M.blurSamples,f.defines.VSM_SAMPLES=M.blurSamples,h.needsUpdate=!0,f.needsUpdate=!0),M.mapPass===null?M.mapPass=new Jn(s.x,s.y,{format:or,type:Bi}):(M.mapPass.width!==M.map.width||M.mapPass.height!==M.map.height)&&M.mapPass.setSize(M.map.width,M.map.height),h.uniforms.shadow_pass.value=M.map.depthTexture,h.uniforms.resolution.value.set(M.map.width,M.map.height),h.uniforms.radius.value=M.radius,n.setRenderTarget(M.mapPass),n.clear(),n.renderBufferDirect(A,null,v,h,x,null),f.uniforms.shadow_pass.value=M.mapPass.texture,f.uniforms.resolution.value.set(M.map.width,M.map.height),f.uniforms.radius.value=M.radius,n.setRenderTarget(M.map),n.clear(),n.renderBufferDirect(A,null,v,f,x,null)}function w(M,A,v,S){let C=null,P=v.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(P!==void 0)C=P;else if(C=v.isPointLight===!0?l:a,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let D=C.uuid,N=A.uuid,I=c[D];I===void 0&&(I={},c[D]=I);let U=I[N];U===void 0&&(U=C.clone(),I[N]=U,A.addEventListener("dispose",_)),C=U}if(C.visible=A.visible,C.wireframe=A.wireframe,S===Ro?C.side=A.shadowSide!==null?A.shadowSide:A.side:C.side=A.shadowSide!==null?A.shadowSide:d[A.side],C.alphaMap=A.alphaMap,C.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,C.map=A.map,C.clipShadows=A.clipShadows,C.clippingPlanes=A.clippingPlanes,C.clipIntersection=A.clipIntersection,C.displacementMap=A.displacementMap,C.displacementScale=A.displacementScale,C.displacementBias=A.displacementBias,C.wireframeLinewidth=A.wireframeLinewidth,C.linewidth=A.linewidth,v.isPointLight===!0&&C.isMeshDistanceMaterial===!0){let D=n.properties.get(C);D.light=v}return C}function y(M,A,v,S,C){if(M.visible===!1)return;if(M.layers.test(A.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&C===Ro)&&(!M.frustumCulled||M.intersectsFrustum(i))){M.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,M.matrixWorld);let N=e.update(M),I=M.material;if(Array.isArray(I)){let U=N.groups;for(let W=0,O=U.length;W<O;W++){let te=U[W],X=I[te.materialIndex];if(X&&X.visible){let q=w(M,X,S,C);M.onBeforeShadow(n,M,A,v,N,q,te),n.renderBufferDirect(v,null,N,q,M,te),M.onAfterShadow(n,M,A,v,N,q,te)}}}else if(I.visible){let U=w(M,I,S,C);M.onBeforeShadow(n,M,A,v,N,U,null),n.renderBufferDirect(v,null,N,U,M,null),M.onAfterShadow(n,M,A,v,N,U,null)}}let D=M.children;for(let N=0,I=D.length;N<I;N++)y(D[N],A,v,S,C)}function _(M){M.target.removeEventListener("dispose",_);for(let v in c){let S=c[v],C=M.target.uuid;C in S&&(S[C].dispose(),delete S[C])}}}function i2(n,e){function t(){let H=!1,Se=new $t,ce=null,Te=new $t(0,0,0,0);return{setMask:function(Ce){ce!==Ce&&!H&&(n.colorMask(Ce,Ce,Ce,Ce),ce=Ce)},setLocked:function(Ce){H=Ce},setClear:function(Ce,ae,Be,Oe,Ct){Ct===!0&&(Ce*=Oe,ae*=Oe,Be*=Oe),Se.set(Ce,ae,Be,Oe),Te.equals(Se)===!1&&(n.clearColor(Ce,ae,Be,Oe),Te.copy(Se))},reset:function(){H=!1,ce=null,Te.set(-1,0,0,0)}}}function i(){let H=!1,Se=!1,ce=null,Te=null,Ce=null;return{setReversed:function(ae){if(Se!==ae){let Be=e.get("EXT_clip_control");ae?Be.clipControlEXT(Be.LOWER_LEFT_EXT,Be.ZERO_TO_ONE_EXT):Be.clipControlEXT(Be.LOWER_LEFT_EXT,Be.NEGATIVE_ONE_TO_ONE_EXT),Se=ae;let Oe=Ce;Ce=null,this.setClear(Oe)}},getReversed:function(){return Se},setTest:function(ae){ae?z(n.DEPTH_TEST):de(n.DEPTH_TEST)},setMask:function(ae){ce!==ae&&!H&&(n.depthMask(ae),ce=ae)},setFunc:function(ae){if(Se&&(ae=jm[ae]),Te!==ae){switch(ae){case sc:n.depthFunc(n.NEVER);break;case rc:n.depthFunc(n.ALWAYS);break;case oc:n.depthFunc(n.LESS);break;case yo:n.depthFunc(n.LEQUAL);break;case ac:n.depthFunc(n.EQUAL);break;case lc:n.depthFunc(n.GEQUAL);break;case cc:n.depthFunc(n.GREATER);break;case uc:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Te=ae}},setLocked:function(ae){H=ae},setClear:function(ae){Ce!==ae&&(Ce=ae,Se&&(ae=1-ae),n.clearDepth(ae))},reset:function(){H=!1,ce=null,Te=null,Ce=null,Se=!1}}}function s(){let H=!1,Se=null,ce=null,Te=null,Ce=null,ae=null,Be=null,Oe=null,Ct=null;return{setTest:function(pt){H||(pt?z(n.STENCIL_TEST):de(n.STENCIL_TEST))},setMask:function(pt){Se!==pt&&!H&&(n.stencilMask(pt),Se=pt)},setFunc:function(pt,Zn,F){(ce!==pt||Te!==Zn||Ce!==F)&&(n.stencilFunc(pt,Zn,F),ce=pt,Te=Zn,Ce=F)},setOp:function(pt,Zn,F){(ae!==pt||Be!==Zn||Oe!==F)&&(n.stencilOp(pt,Zn,F),ae=pt,Be=Zn,Oe=F)},setLocked:function(pt){H=pt},setClear:function(pt){Ct!==pt&&(n.clearStencil(pt),Ct=pt)},reset:function(){H=!1,Se=null,ce=null,Te=null,Ce=null,ae=null,Be=null,Oe=null,Ct=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,u={},d={},h={},f=new WeakMap,p=[],x=null,g=!1,m=null,b=null,w=null,y=null,_=null,M=null,A=null,v=new Re(0,0,0),S=0,C=!1,P=null,D=null,N=null,I=null,U=null,W=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),O=!1,te=0,X=n.getParameter(n.VERSION);X.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(X)[1]),O=te>=1):X.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),O=te>=2);let q=null,$={},he=n.getParameter(n.SCISSOR_BOX),Q=n.getParameter(n.VIEWPORT),fe=new $t().fromArray(he),re=new $t().fromArray(Q);function pe(H,Se,ce,Te){let Ce=new Uint8Array(4),ae=n.createTexture();n.bindTexture(H,ae),n.texParameteri(H,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(H,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Be=0;Be<ce;Be++)H===n.TEXTURE_3D||H===n.TEXTURE_2D_ARRAY?n.texImage3D(Se,0,n.RGBA,1,1,Te,0,n.RGBA,n.UNSIGNED_BYTE,Ce):n.texImage2D(Se+Be,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ce);return ae}let k={};k[n.TEXTURE_2D]=pe(n.TEXTURE_2D,n.TEXTURE_2D,1),k[n.TEXTURE_CUBE_MAP]=pe(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),k[n.TEXTURE_2D_ARRAY]=pe(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),k[n.TEXTURE_3D]=pe(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),z(n.DEPTH_TEST),o.setFunc(yo),xe(!1),Ve(gd),z(n.CULL_FACE),me(is);function z(H){u[H]!==!0&&(n.enable(H),u[H]=!0)}function de(H){u[H]!==!1&&(n.disable(H),u[H]=!1)}function Ee(H,Se){return h[H]!==Se?(n.bindFramebuffer(H,Se),h[H]=Se,H===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=Se),H===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=Se),!0):!1}function ge(H,Se){let ce=p,Te=!1;if(H){ce=f.get(Se),ce===void 0&&(ce=[],f.set(Se,ce));let Ce=H.textures;if(ce.length!==Ce.length||ce[0]!==n.COLOR_ATTACHMENT0){for(let ae=0,Be=Ce.length;ae<Be;ae++)ce[ae]=n.COLOR_ATTACHMENT0+ae;ce.length=Ce.length,Te=!0}}else ce[0]!==n.BACK&&(ce[0]=n.BACK,Te=!0);Te&&n.drawBuffers(ce)}function Ue(H){return x!==H?(n.useProgram(H),x=H,!0):!1}let vt={[Cr]:n.FUNC_ADD,[ym]:n.FUNC_SUBTRACT,[vm]:n.FUNC_REVERSE_SUBTRACT};vt[_m]=n.MIN,vt[Mm]=n.MAX;let G={[wm]:n.ZERO,[Sm]:n.ONE,[Tm]:n.SRC_COLOR,[yd]:n.SRC_ALPHA,[Im]:n.SRC_ALPHA_SATURATE,[Cm]:n.DST_COLOR,[Am]:n.DST_ALPHA,[Em]:n.ONE_MINUS_SRC_COLOR,[vd]:n.ONE_MINUS_SRC_ALPHA,[Pm]:n.ONE_MINUS_DST_COLOR,[Rm]:n.ONE_MINUS_DST_ALPHA,[Lm]:n.CONSTANT_COLOR,[Dm]:n.ONE_MINUS_CONSTANT_COLOR,[km]:n.CONSTANT_ALPHA,[Nm]:n.ONE_MINUS_CONSTANT_ALPHA};function me(H,Se,ce,Te,Ce,ae,Be,Oe,Ct,pt){if(H===is){g===!0&&(de(n.BLEND),g=!1);return}if(g===!1&&(z(n.BLEND),g=!0),H!==bm){if(H!==m||pt!==C){if((b!==Cr||_!==Cr)&&(n.blendEquation(n.FUNC_ADD),b=Cr,_=Cr),pt)switch(H){case Co:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ka:n.blendFunc(n.ONE,n.ONE);break;case xd:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case bd:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:tt("WebGLState: Invalid blending: ",H);break}else switch(H){case Co:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ka:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case xd:tt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case bd:tt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:tt("WebGLState: Invalid blending: ",H);break}w=null,y=null,M=null,A=null,v.set(0,0,0),S=0,m=H,C=pt}return}Ce=Ce||Se,ae=ae||ce,Be=Be||Te,(Se!==b||Ce!==_)&&(n.blendEquationSeparate(vt[Se],vt[Ce]),b=Se,_=Ce),(ce!==w||Te!==y||ae!==M||Be!==A)&&(n.blendFuncSeparate(G[ce],G[Te],G[ae],G[Be]),w=ce,y=Te,M=ae,A=Be),(Oe.equals(v)===!1||Ct!==S)&&(n.blendColor(Oe.r,Oe.g,Oe.b,Ct),v.copy(Oe),S=Ct),m=H,C=!1}function ke(H,Se){H.side===Vn?de(n.CULL_FACE):z(n.CULL_FACE);let ce=H.side===Gn;Se&&(ce=!ce),xe(ce),H.blending===Co&&H.transparent===!1?me(is):me(H.blending,H.blendEquation,H.blendSrc,H.blendDst,H.blendEquationAlpha,H.blendSrcAlpha,H.blendDstAlpha,H.blendColor,H.blendAlpha,H.premultipliedAlpha),o.setFunc(H.depthFunc),o.setTest(H.depthTest),o.setMask(H.depthWrite),r.setMask(H.colorWrite);let Te=H.stencilWrite;a.setTest(Te),Te&&(a.setMask(H.stencilWriteMask),a.setFunc(H.stencilFunc,H.stencilRef,H.stencilFuncMask),a.setOp(H.stencilFail,H.stencilZFail,H.stencilZPass)),dt(H.polygonOffset,H.polygonOffsetFactor,H.polygonOffsetUnits),H.alphaToCoverage===!0?z(n.SAMPLE_ALPHA_TO_COVERAGE):de(n.SAMPLE_ALPHA_TO_COVERAGE)}function xe(H){P!==H&&(H?n.frontFace(n.CW):n.frontFace(n.CCW),P=H)}function Ve(H){H!==mm?(z(n.CULL_FACE),H!==D&&(H===gd?n.cullFace(n.BACK):H===gm?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):de(n.CULL_FACE),D=H}function Je(H){H!==N&&(O&&n.lineWidth(H),N=H)}function dt(H,Se,ce){H?(z(n.POLYGON_OFFSET_FILL),(I!==Se||U!==ce)&&(I=Se,U=ce,o.getReversed()&&(Se=-Se),n.polygonOffset(Se,ce))):de(n.POLYGON_OFFSET_FILL)}function _t(H){H?z(n.SCISSOR_TEST):de(n.SCISSOR_TEST)}function Dt(H){H===void 0&&(H=n.TEXTURE0+W-1),q!==H&&(n.activeTexture(H),q=H)}function V(H,Se,ce){ce===void 0&&(q===null?ce=n.TEXTURE0+W-1:ce=q);let Te=$[ce];Te===void 0&&(Te={type:void 0,texture:void 0},$[ce]=Te),(Te.type!==H||Te.texture!==Se)&&(q!==ce&&(n.activeTexture(ce),q=ce),n.bindTexture(H,Se||k[H]),Te.type=H,Te.texture=Se)}function on(){let H=$[q];H!==void 0&&H.type!==void 0&&(n.bindTexture(H.type,null),H.type=void 0,H.texture=void 0)}function At(){try{n.compressedTexImage2D(...arguments)}catch(H){tt("WebGLState:",H)}}function L(){try{n.compressedTexImage3D(...arguments)}catch(H){tt("WebGLState:",H)}}function T(){try{n.texSubImage2D(...arguments)}catch(H){tt("WebGLState:",H)}}function Y(){try{n.texSubImage3D(...arguments)}catch(H){tt("WebGLState:",H)}}function ee(){try{n.compressedTexSubImage2D(...arguments)}catch(H){tt("WebGLState:",H)}}function ie(){try{n.compressedTexSubImage3D(...arguments)}catch(H){tt("WebGLState:",H)}}function ye(){try{n.texStorage2D(...arguments)}catch(H){tt("WebGLState:",H)}}function _e(){try{n.texStorage3D(...arguments)}catch(H){tt("WebGLState:",H)}}function se(){try{n.texImage2D(...arguments)}catch(H){tt("WebGLState:",H)}}function oe(){try{n.texImage3D(...arguments)}catch(H){tt("WebGLState:",H)}}function Me(H){return d[H]!==void 0?d[H]:n.getParameter(H)}function Ye(H,Se){d[H]!==Se&&(n.pixelStorei(H,Se),d[H]=Se)}function Ae(H){fe.equals(H)===!1&&(n.scissor(H.x,H.y,H.z,H.w),fe.copy(H))}function we(H){re.equals(H)===!1&&(n.viewport(H.x,H.y,H.z,H.w),re.copy(H))}function Xe(H,Se){let ce=c.get(Se);ce===void 0&&(ce=new WeakMap,c.set(Se,ce));let Te=ce.get(H);Te===void 0&&(Te=n.getUniformBlockIndex(Se,H.name),ce.set(H,Te))}function je(H,Se){let Te=c.get(Se).get(H);l.get(Se)!==Te&&(n.uniformBlockBinding(Se,Te,H.__bindingPointIndex),l.set(Se,Te))}function rt(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},d={},q=null,$={},h={},f=new WeakMap,p=[],x=null,g=!1,m=null,b=null,w=null,y=null,_=null,M=null,A=null,v=new Re(0,0,0),S=0,C=!1,P=null,D=null,N=null,I=null,U=null,fe.set(0,0,n.canvas.width,n.canvas.height),re.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:z,disable:de,bindFramebuffer:Ee,drawBuffers:ge,useProgram:Ue,setBlending:me,setMaterial:ke,setFlipSided:xe,setCullFace:Ve,setLineWidth:Je,setPolygonOffset:dt,setScissorTest:_t,activeTexture:Dt,bindTexture:V,unbindTexture:on,compressedTexImage2D:At,compressedTexImage3D:L,texImage2D:se,texImage3D:oe,pixelStorei:Ye,getParameter:Me,updateUBOMapping:Xe,uniformBlockBinding:je,texStorage2D:ye,texStorage3D:_e,texSubImage2D:T,texSubImage3D:Y,compressedTexSubImage2D:ee,compressedTexSubImage3D:ie,scissor:Ae,viewport:we,reset:rt}}function s2(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ft,u=new WeakMap,d=new Set,h,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(L,T){return p?new OffscreenCanvas(L,T):ya("canvas")}function g(L,T,Y){let ee=1,ie=At(L);if((ie.width>Y||ie.height>Y)&&(ee=Y/Math.max(ie.width,ie.height)),ee<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){let ye=Math.floor(ee*ie.width),_e=Math.floor(ee*ie.height);h===void 0&&(h=x(ye,_e));let se=T?x(ye,_e):h;return se.width=ye,se.height=_e,se.getContext("2d").drawImage(L,0,0,ye,_e),et("WebGLRenderer: Texture has been resized from ("+ie.width+"x"+ie.height+") to ("+ye+"x"+_e+")."),se}else return"data"in L&&et("WebGLRenderer: Image in DataTexture is too big ("+ie.width+"x"+ie.height+")."),L;return L}function m(L){return L.generateMipmaps}function b(L){n.generateMipmap(L)}function w(L){return L.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?n.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function y(L,T,Y,ee,ie,ye=!1){if(L!==null){if(n[L]!==void 0)return n[L];et("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let _e;ee&&(_e=e.get("EXT_texture_norm16"),_e||et("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let se=T;if(T===n.RED&&(Y===n.FLOAT&&(se=n.R32F),Y===n.HALF_FLOAT&&(se=n.R16F),Y===n.UNSIGNED_BYTE&&(se=n.R8),Y===n.UNSIGNED_SHORT&&_e&&(se=_e.R16_EXT),Y===n.SHORT&&_e&&(se=_e.R16_SNORM_EXT)),T===n.RED_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.R8UI),Y===n.UNSIGNED_SHORT&&(se=n.R16UI),Y===n.UNSIGNED_INT&&(se=n.R32UI),Y===n.BYTE&&(se=n.R8I),Y===n.SHORT&&(se=n.R16I),Y===n.INT&&(se=n.R32I)),T===n.RG&&(Y===n.FLOAT&&(se=n.RG32F),Y===n.HALF_FLOAT&&(se=n.RG16F),Y===n.UNSIGNED_BYTE&&(se=n.RG8),Y===n.UNSIGNED_SHORT&&_e&&(se=_e.RG16_EXT),Y===n.SHORT&&_e&&(se=_e.RG16_SNORM_EXT)),T===n.RG_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.RG8UI),Y===n.UNSIGNED_SHORT&&(se=n.RG16UI),Y===n.UNSIGNED_INT&&(se=n.RG32UI),Y===n.BYTE&&(se=n.RG8I),Y===n.SHORT&&(se=n.RG16I),Y===n.INT&&(se=n.RG32I)),T===n.RGB_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.RGB8UI),Y===n.UNSIGNED_SHORT&&(se=n.RGB16UI),Y===n.UNSIGNED_INT&&(se=n.RGB32UI),Y===n.BYTE&&(se=n.RGB8I),Y===n.SHORT&&(se=n.RGB16I),Y===n.INT&&(se=n.RGB32I)),T===n.RGBA_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.RGBA8UI),Y===n.UNSIGNED_SHORT&&(se=n.RGBA16UI),Y===n.UNSIGNED_INT&&(se=n.RGBA32UI),Y===n.BYTE&&(se=n.RGBA8I),Y===n.SHORT&&(se=n.RGBA16I),Y===n.INT&&(se=n.RGBA32I)),T===n.RGB&&(Y===n.UNSIGNED_SHORT&&_e&&(se=_e.RGB16_EXT),Y===n.SHORT&&_e&&(se=_e.RGB16_SNORM_EXT),Y===n.UNSIGNED_INT_5_9_9_9_REV&&(se=n.RGB9_E5),Y===n.UNSIGNED_INT_10F_11F_11F_REV&&(se=n.R11F_G11F_B10F)),T===n.RGBA){let oe=ye?ba:bt.getTransfer(ie);Y===n.FLOAT&&(se=n.RGBA32F),Y===n.HALF_FLOAT&&(se=n.RGBA16F),Y===n.UNSIGNED_BYTE&&(se=oe===Lt?n.SRGB8_ALPHA8:n.RGBA8),Y===n.UNSIGNED_SHORT&&_e&&(se=_e.RGBA16_EXT),Y===n.SHORT&&_e&&(se=_e.RGBA16_SNORM_EXT),Y===n.UNSIGNED_SHORT_4_4_4_4&&(se=n.RGBA4),Y===n.UNSIGNED_SHORT_5_5_5_1&&(se=n.RGB5_A1)}return(se===n.R16F||se===n.R32F||se===n.RG16F||se===n.RG32F||se===n.RGBA16F||se===n.RGBA32F)&&e.get("EXT_color_buffer_float"),se}function _(L,T){let Y;return L?T===null||T===Fi||T===Io?Y=n.DEPTH24_STENCIL8:T===wi?Y=n.DEPTH32F_STENCIL8:T===Po&&(Y=n.DEPTH24_STENCIL8,et("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===Fi||T===Io?Y=n.DEPTH_COMPONENT24:T===wi?Y=n.DEPTH_COMPONENT32F:T===Po&&(Y=n.DEPTH_COMPONENT16),Y}function M(L,T){return m(L)===!0||L.isFramebufferTexture&&L.minFilter!==Kt&&L.minFilter!==qt?Math.log2(Math.max(T.width,T.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?T.mipmaps.length:1}function A(L){let T=L.target;T.removeEventListener("dispose",A),S(T),T.isVideoTexture&&u.delete(T),T.isHTMLTexture&&d.delete(T)}function v(L){let T=L.target;T.removeEventListener("dispose",v),P(T)}function S(L){let T=i.get(L);if(T.__webglInit===void 0)return;let Y=L.source,ee=f.get(Y);if(ee){let ie=ee[T.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&C(L),Object.keys(ee).length===0&&f.delete(Y)}i.remove(L)}function C(L){let T=i.get(L);n.deleteTexture(T.__webglTexture);let Y=L.source,ee=f.get(Y);delete ee[T.__cacheKey],o.memory.textures--}function P(L){let T=i.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),i.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(T.__webglFramebuffer[ee]))for(let ie=0;ie<T.__webglFramebuffer[ee].length;ie++)n.deleteFramebuffer(T.__webglFramebuffer[ee][ie]);else n.deleteFramebuffer(T.__webglFramebuffer[ee]);T.__webglDepthbuffer&&n.deleteRenderbuffer(T.__webglDepthbuffer[ee])}else{if(Array.isArray(T.__webglFramebuffer))for(let ee=0;ee<T.__webglFramebuffer.length;ee++)n.deleteFramebuffer(T.__webglFramebuffer[ee]);else n.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&n.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&n.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let ee=0;ee<T.__webglColorRenderbuffer.length;ee++)T.__webglColorRenderbuffer[ee]&&n.deleteRenderbuffer(T.__webglColorRenderbuffer[ee]);T.__webglDepthRenderbuffer&&n.deleteRenderbuffer(T.__webglDepthRenderbuffer)}let Y=L.textures;for(let ee=0,ie=Y.length;ee<ie;ee++){let ye=i.get(Y[ee]);ye.__webglTexture&&(n.deleteTexture(ye.__webglTexture),o.memory.textures--),i.remove(Y[ee])}i.remove(L)}let D=0;function N(){D=0}function I(){return D}function U(L){D=L}function W(){let L=D;return L>=s.maxTextures&&et("WebGLTextures: Trying to use "+(L+1)+" texture units while this GPU supports only "+s.maxTextures),D+=1,L}function O(L){let T=[];return T.push(L.wrapS),T.push(L.wrapT),T.push(L.wrapR||0),T.push(L.magFilter),T.push(L.minFilter),T.push(L.anisotropy),T.push(L.internalFormat),T.push(L.format),T.push(L.type),T.push(L.generateMipmaps),T.push(L.premultiplyAlpha),T.push(L.flipY),T.push(L.unpackAlignment),T.push(L.colorSpace),T.join()}function te(L,T){let Y=i.get(L);if(L.isVideoTexture&&V(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&Y.__version!==L.version){let ee=L.image;if(ee===null)et("WebGLRenderer: Texture marked for update but no image data found.");else if(ee.complete===!1)et("WebGLRenderer: Texture marked for update but image is incomplete");else{de(Y,L,T);return}}else L.isExternalTexture&&(Y.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,Y.__webglTexture,n.TEXTURE0+T)}function X(L,T){let Y=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&Y.__version!==L.version){de(Y,L,T);return}else L.isExternalTexture&&(Y.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,Y.__webglTexture,n.TEXTURE0+T)}function q(L,T){let Y=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&Y.__version!==L.version){de(Y,L,T);return}t.bindTexture(n.TEXTURE_3D,Y.__webglTexture,n.TEXTURE0+T)}function $(L,T){let Y=i.get(L);if(L.isCubeDepthTexture!==!0&&L.version>0&&Y.__version!==L.version){Ee(Y,L,T);return}t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture,n.TEXTURE0+T)}let he={[hc]:n.REPEAT,[Kn]:n.CLAMP_TO_EDGE,[dc]:n.MIRRORED_REPEAT},Q={[Kt]:n.NEAREST,[Fm]:n.NEAREST_MIPMAP_NEAREST,[Fa]:n.NEAREST_MIPMAP_LINEAR,[qt]:n.LINEAR,[Oc]:n.LINEAR_MIPMAP_NEAREST,[Mi]:n.LINEAR_MIPMAP_LINEAR},fe={[Gm]:n.NEVER,[qm]:n.ALWAYS,[Vm]:n.LESS,[_u]:n.LEQUAL,[Wm]:n.EQUAL,[Mu]:n.GEQUAL,[Xm]:n.GREATER,[Ym]:n.NOTEQUAL};function re(L,T){if(T.type===wi&&e.has("OES_texture_float_linear")===!1&&(T.magFilter===qt||T.magFilter===Oc||T.magFilter===Fa||T.magFilter===Mi||T.minFilter===qt||T.minFilter===Oc||T.minFilter===Fa||T.minFilter===Mi)&&et("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(L,n.TEXTURE_WRAP_S,he[T.wrapS]),n.texParameteri(L,n.TEXTURE_WRAP_T,he[T.wrapT]),(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)&&n.texParameteri(L,n.TEXTURE_WRAP_R,he[T.wrapR]),n.texParameteri(L,n.TEXTURE_MAG_FILTER,Q[T.magFilter]),n.texParameteri(L,n.TEXTURE_MIN_FILTER,Q[T.minFilter]),T.compareFunction&&(n.texParameteri(L,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(L,n.TEXTURE_COMPARE_FUNC,fe[T.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===Kt||T.minFilter!==Fa&&T.minFilter!==Mi||T.type===wi&&e.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||i.get(T).__currentAnisotropy){let Y=e.get("EXT_texture_filter_anisotropic");n.texParameterf(L,Y.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,s.getMaxAnisotropy())),i.get(T).__currentAnisotropy=T.anisotropy}}}function pe(L,T){let Y=!1;L.__webglInit===void 0&&(L.__webglInit=!0,T.addEventListener("dispose",A));let ee=T.source,ie=f.get(ee);ie===void 0&&(ie={},f.set(ee,ie));let ye=O(T);if(ye!==L.__cacheKey){ie[ye]===void 0&&(ie[ye]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,Y=!0),ie[ye].usedTimes++;let _e=ie[L.__cacheKey];_e!==void 0&&(ie[L.__cacheKey].usedTimes--,_e.usedTimes===0&&C(T)),L.__cacheKey=ye,L.__webglTexture=ie[ye].texture}return Y}function k(L,T,Y){return Math.floor(Math.floor(L/Y)/T)}function z(L,T,Y,ee){let ye=L.updateRanges;if(ye.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,T.width,T.height,Y,ee,T.data);else{ye.sort((Ye,Ae)=>Ye.start-Ae.start);let _e=0;for(let Ye=1;Ye<ye.length;Ye++){let Ae=ye[_e],we=ye[Ye],Xe=Ae.start+Ae.count,je=k(we.start,T.width,4),rt=k(Ae.start,T.width,4);we.start<=Xe+1&&je===rt&&k(we.start+we.count-1,T.width,4)===je?Ae.count=Math.max(Ae.count,we.start+we.count-Ae.start):(++_e,ye[_e]=we)}ye.length=_e+1;let se=t.getParameter(n.UNPACK_ROW_LENGTH),oe=t.getParameter(n.UNPACK_SKIP_PIXELS),Me=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,T.width);for(let Ye=0,Ae=ye.length;Ye<Ae;Ye++){let we=ye[Ye],Xe=Math.floor(we.start/4),je=Math.ceil(we.count/4),rt=Xe%T.width,H=Math.floor(Xe/T.width),Se=je,ce=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,rt),t.pixelStorei(n.UNPACK_SKIP_ROWS,H),t.texSubImage2D(n.TEXTURE_2D,0,rt,H,Se,ce,Y,ee,T.data)}L.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,se),t.pixelStorei(n.UNPACK_SKIP_PIXELS,oe),t.pixelStorei(n.UNPACK_SKIP_ROWS,Me)}}function de(L,T,Y){let ee=n.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(ee=n.TEXTURE_2D_ARRAY),T.isData3DTexture&&(ee=n.TEXTURE_3D);let ie=pe(L,T),ye=T.source;t.bindTexture(ee,L.__webglTexture,n.TEXTURE0+Y);let _e=i.get(ye);if(ye.version!==_e.__version||ie===!0){if(t.activeTexture(n.TEXTURE0+Y),(typeof ImageBitmap<"u"&&T.image instanceof ImageBitmap)===!1){let ce=bt.getPrimaries(bt.workingColorSpace),Te=T.colorSpace===Ss?null:bt.getPrimaries(T.colorSpace),Ce=T.colorSpace===Ss||ce===Te?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,T.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce)}t.pixelStorei(n.UNPACK_ALIGNMENT,T.unpackAlignment);let oe=g(T.image,!1,s.maxTextureSize);oe=on(T,oe);let Me=r.convert(T.format,T.colorSpace),Ye=r.convert(T.type),Ae=y(T.internalFormat,Me,Ye,T.normalized,T.colorSpace,T.isVideoTexture);re(ee,T);let we,Xe=T.mipmaps,je=T.isVideoTexture!==!0,rt=_e.__version===void 0||ie===!0,H=ye.dataReady,Se=M(T,oe);if(T.isDepthTexture)Ae=_(T.format===rr,T.type),rt&&(je?t.texStorage2D(n.TEXTURE_2D,1,Ae,oe.width,oe.height):t.texImage2D(n.TEXTURE_2D,0,Ae,oe.width,oe.height,0,Me,Ye,null));else if(T.isDataTexture)if(Xe.length>0){je&&rt&&t.texStorage2D(n.TEXTURE_2D,Se,Ae,Xe[0].width,Xe[0].height);for(let ce=0,Te=Xe.length;ce<Te;ce++)we=Xe[ce],je?H&&t.texSubImage2D(n.TEXTURE_2D,ce,0,0,we.width,we.height,Me,Ye,we.data):t.texImage2D(n.TEXTURE_2D,ce,Ae,we.width,we.height,0,Me,Ye,we.data);T.generateMipmaps=!1}else je?(rt&&t.texStorage2D(n.TEXTURE_2D,Se,Ae,oe.width,oe.height),H&&z(T,oe,Me,Ye)):t.texImage2D(n.TEXTURE_2D,0,Ae,oe.width,oe.height,0,Me,Ye,oe.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){je&&rt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Se,Ae,Xe[0].width,Xe[0].height,oe.depth);for(let ce=0,Te=Xe.length;ce<Te;ce++)if(we=Xe[ce],T.format!==Ln)if(Me!==null)if(je){if(H)if(T.layerUpdates.size>0){let Ce=zd(we.width,we.height,T.format,T.type);for(let ae of T.layerUpdates){let Be=we.data.subarray(ae*Ce/we.data.BYTES_PER_ELEMENT,(ae+1)*Ce/we.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ce,0,0,ae,we.width,we.height,1,Me,Be)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ce,0,0,0,we.width,we.height,oe.depth,Me,we.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ce,Ae,we.width,we.height,oe.depth,0,we.data,0,0);else et("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else je?H&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ce,0,0,0,we.width,we.height,oe.depth,Me,Ye,we.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ce,Ae,we.width,we.height,oe.depth,0,Me,Ye,we.data);T.layerUpdates.size>0&&T.clearLayerUpdates()}else{je&&rt&&t.texStorage2D(n.TEXTURE_2D,Se,Ae,Xe[0].width,Xe[0].height);for(let ce=0,Te=Xe.length;ce<Te;ce++)we=Xe[ce],T.format!==Ln?Me!==null?je?H&&t.compressedTexSubImage2D(n.TEXTURE_2D,ce,0,0,we.width,we.height,Me,we.data):t.compressedTexImage2D(n.TEXTURE_2D,ce,Ae,we.width,we.height,0,we.data):et("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):je?H&&t.texSubImage2D(n.TEXTURE_2D,ce,0,0,we.width,we.height,Me,Ye,we.data):t.texImage2D(n.TEXTURE_2D,ce,Ae,we.width,we.height,0,Me,Ye,we.data)}else if(T.isDataArrayTexture)if(je){if(rt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Se,Ae,oe.width,oe.height,oe.depth),H)if(T.layerUpdates.size>0){let ce=zd(oe.width,oe.height,T.format,T.type);for(let Te of T.layerUpdates){let Ce=oe.data.subarray(Te*ce/oe.data.BYTES_PER_ELEMENT,(Te+1)*ce/oe.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Te,oe.width,oe.height,1,Me,Ye,Ce)}T.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,oe.width,oe.height,oe.depth,Me,Ye,oe.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ae,oe.width,oe.height,oe.depth,0,Me,Ye,oe.data);else if(T.isData3DTexture)je?(rt&&t.texStorage3D(n.TEXTURE_3D,Se,Ae,oe.width,oe.height,oe.depth),H&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,oe.width,oe.height,oe.depth,Me,Ye,oe.data)):t.texImage3D(n.TEXTURE_3D,0,Ae,oe.width,oe.height,oe.depth,0,Me,Ye,oe.data);else if(T.isFramebufferTexture){if(rt)if(je)t.texStorage2D(n.TEXTURE_2D,Se,Ae,oe.width,oe.height);else{let ce=oe.width,Te=oe.height;for(let Ce=0;Ce<Se;Ce++)t.texImage2D(n.TEXTURE_2D,Ce,Ae,ce,Te,0,Me,Ye,null),ce>>=1,Te>>=1}}else if(T.isHTMLTexture){if("texElementImage2D"in n){let ce=n.canvas;if(ce.hasAttribute("layoutsubtree")||ce.setAttribute("layoutsubtree","true"),oe.parentNode!==ce){ce.appendChild(oe),d.add(T),ce.onpaint=Te=>{let Ce=Te.changedElements;for(let ae of d)Ce.includes(ae.image)&&(ae.needsUpdate=!0)},ce.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,oe);else{let Ce=n.RGBA,ae=n.RGBA,Be=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,Ce,ae,Be,oe)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Xe.length>0){if(je&&rt){let ce=At(Xe[0]);t.texStorage2D(n.TEXTURE_2D,Se,Ae,ce.width,ce.height)}for(let ce=0,Te=Xe.length;ce<Te;ce++)we=Xe[ce],je?H&&t.texSubImage2D(n.TEXTURE_2D,ce,0,0,Me,Ye,we):t.texImage2D(n.TEXTURE_2D,ce,Ae,Me,Ye,we);T.generateMipmaps=!1}else if(je){if(rt){let ce=At(oe);t.texStorage2D(n.TEXTURE_2D,Se,Ae,ce.width,ce.height)}H&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Me,Ye,oe)}else t.texImage2D(n.TEXTURE_2D,0,Ae,Me,Ye,oe);m(T)&&b(ee),_e.__version=ye.version,T.onUpdate&&T.onUpdate(T)}L.__version=T.version}function Ee(L,T,Y){if(T.image.length!==6)return;let ee=pe(L,T),ie=T.source;t.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture,n.TEXTURE0+Y);let ye=i.get(ie);if(ie.version!==ye.__version||ee===!0){t.activeTexture(n.TEXTURE0+Y);let _e=bt.getPrimaries(bt.workingColorSpace),se=T.colorSpace===Ss?null:bt.getPrimaries(T.colorSpace),oe=T.colorSpace===Ss||_e===se?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,T.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,T.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe);let Me=T.isCompressedTexture||T.image[0].isCompressedTexture,Ye=T.image[0]&&T.image[0].isDataTexture,Ae=[];for(let ae=0;ae<6;ae++)!Me&&!Ye?Ae[ae]=g(T.image[ae],!0,s.maxCubemapSize):Ae[ae]=Ye?T.image[ae].image:T.image[ae],Ae[ae]=on(T,Ae[ae]);let we=Ae[0],Xe=r.convert(T.format,T.colorSpace),je=r.convert(T.type),rt=y(T.internalFormat,Xe,je,T.normalized,T.colorSpace),H=T.isVideoTexture!==!0,Se=ye.__version===void 0||ee===!0,ce=ie.dataReady,Te=M(T,we);re(n.TEXTURE_CUBE_MAP,T);let Ce;if(Me){H&&Se&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Te,rt,we.width,we.height);for(let ae=0;ae<6;ae++){Ce=Ae[ae].mipmaps;for(let Be=0;Be<Ce.length;Be++){let Oe=Ce[Be];T.format!==Ln?Xe!==null?H?ce&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be,0,0,Oe.width,Oe.height,Xe,Oe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be,rt,Oe.width,Oe.height,0,Oe.data):et("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):H?ce&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be,0,0,Oe.width,Oe.height,Xe,je,Oe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be,rt,Oe.width,Oe.height,0,Xe,je,Oe.data)}}}else{if(Ce=T.mipmaps,H&&Se){Ce.length>0&&Te++;let ae=At(Ae[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Te,rt,ae.width,ae.height)}for(let ae=0;ae<6;ae++)if(Ye){H?ce&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,Ae[ae].width,Ae[ae].height,Xe,je,Ae[ae].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,rt,Ae[ae].width,Ae[ae].height,0,Xe,je,Ae[ae].data);for(let Be=0;Be<Ce.length;Be++){let Ct=Ce[Be].image[ae].image;H?ce&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be+1,0,0,Ct.width,Ct.height,Xe,je,Ct.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be+1,rt,Ct.width,Ct.height,0,Xe,je,Ct.data)}}else{H?ce&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,Xe,je,Ae[ae]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,rt,Xe,je,Ae[ae]);for(let Be=0;Be<Ce.length;Be++){let Oe=Ce[Be];H?ce&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be+1,0,0,Xe,je,Oe.image[ae]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Be+1,rt,Xe,je,Oe.image[ae])}}}m(T)&&b(n.TEXTURE_CUBE_MAP),ye.__version=ie.version,T.onUpdate&&T.onUpdate(T)}L.__version=T.version}function ge(L,T,Y,ee,ie,ye){let _e=r.convert(Y.format,Y.colorSpace),se=r.convert(Y.type),oe=y(Y.internalFormat,_e,se,Y.normalized,Y.colorSpace),Me=i.get(T),Ye=i.get(Y);if(Ye.__renderTarget=T,!Me.__hasExternalTextures){let Ae=Math.max(1,T.width>>ye),we=Math.max(1,T.height>>ye);ie===n.TEXTURE_3D||ie===n.TEXTURE_2D_ARRAY?t.texImage3D(ie,ye,oe,Ae,we,T.depth,0,_e,se,null):t.texImage2D(ie,ye,oe,Ae,we,0,_e,se,null)}t.bindFramebuffer(n.FRAMEBUFFER,L),Dt(T)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ee,ie,Ye.__webglTexture,0,_t(T)):(ie===n.TEXTURE_2D||ie>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ee,ie,Ye.__webglTexture,ye),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Ue(L,T,Y){if(n.bindRenderbuffer(n.RENDERBUFFER,L),T.depthBuffer){let ee=T.depthTexture,ie=ee&&ee.isDepthTexture?ee.type:null,ye=_(T.stencilBuffer,ie),_e=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Dt(T)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,_t(T),ye,T.width,T.height):Y?n.renderbufferStorageMultisample(n.RENDERBUFFER,_t(T),ye,T.width,T.height):n.renderbufferStorage(n.RENDERBUFFER,ye,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,_e,n.RENDERBUFFER,L)}else{let ee=T.textures;for(let ie=0;ie<ee.length;ie++){let ye=ee[ie],_e=r.convert(ye.format,ye.colorSpace),se=r.convert(ye.type),oe=y(ye.internalFormat,_e,se,ye.normalized,ye.colorSpace);Dt(T)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,_t(T),oe,T.width,T.height):Y?n.renderbufferStorageMultisample(n.RENDERBUFFER,_t(T),oe,T.width,T.height):n.renderbufferStorage(n.RENDERBUFFER,oe,T.width,T.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function vt(L,T,Y){let ee=T.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,L),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ie=i.get(T.depthTexture);if(ie.__renderTarget=T,(!ie.__webglTexture||T.depthTexture.image.width!==T.width||T.depthTexture.image.height!==T.height)&&(T.depthTexture.image.width=T.width,T.depthTexture.image.height=T.height,T.depthTexture.needsUpdate=!0),ee){if(ie.__webglInit===void 0&&(ie.__webglInit=!0,T.depthTexture.addEventListener("dispose",A)),ie.__webglTexture===void 0){ie.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,ie.__webglTexture),re(n.TEXTURE_CUBE_MAP,T.depthTexture);let Me=r.convert(T.depthTexture.format),Ye=r.convert(T.depthTexture.type),Ae;T.depthTexture.format===ji?Ae=n.DEPTH_COMPONENT24:T.depthTexture.format===rr&&(Ae=n.DEPTH24_STENCIL8);for(let we=0;we<6;we++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+we,0,Ae,T.width,T.height,0,Me,Ye,null)}}else te(T.depthTexture,0);let ye=ie.__webglTexture,_e=_t(T),se=ee?n.TEXTURE_CUBE_MAP_POSITIVE_X+Y:n.TEXTURE_2D,oe=T.depthTexture.format===rr?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(T.depthTexture.format===ji)Dt(T)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,oe,se,ye,0,_e):n.framebufferTexture2D(n.FRAMEBUFFER,oe,se,ye,0);else if(T.depthTexture.format===rr)Dt(T)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,oe,se,ye,0,_e):n.framebufferTexture2D(n.FRAMEBUFFER,oe,se,ye,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function G(L){let T=i.get(L),Y=L.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==L.depthTexture){let ee=L.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),ee){let ie=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,ee.removeEventListener("dispose",ie)};ee.addEventListener("dispose",ie),T.__depthDisposeCallback=ie}T.__boundDepthTexture=ee}if(L.depthTexture&&!T.__autoAllocateDepthBuffer)if(Y)for(let ee=0;ee<6;ee++)vt(T.__webglFramebuffer[ee],L,ee);else{let ee=L.texture.mipmaps;ee&&ee.length>0?vt(T.__webglFramebuffer[0],L,0):vt(T.__webglFramebuffer,L,0)}else if(Y){T.__webglDepthbuffer=[];for(let ee=0;ee<6;ee++)if(t.bindFramebuffer(n.FRAMEBUFFER,T.__webglFramebuffer[ee]),T.__webglDepthbuffer[ee]===void 0)T.__webglDepthbuffer[ee]=n.createRenderbuffer(),Ue(T.__webglDepthbuffer[ee],L,!1);else{let ie=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ye=T.__webglDepthbuffer[ee];n.bindRenderbuffer(n.RENDERBUFFER,ye),n.framebufferRenderbuffer(n.FRAMEBUFFER,ie,n.RENDERBUFFER,ye)}}else{let ee=L.texture.mipmaps;if(ee&&ee.length>0?t.bindFramebuffer(n.FRAMEBUFFER,T.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=n.createRenderbuffer(),Ue(T.__webglDepthbuffer,L,!1);else{let ie=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ye=T.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ye),n.framebufferRenderbuffer(n.FRAMEBUFFER,ie,n.RENDERBUFFER,ye)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function me(L,T,Y){let ee=i.get(L);T!==void 0&&ge(ee.__webglFramebuffer,L,L.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),Y!==void 0&&G(L)}function ke(L){let T=L.texture,Y=i.get(L),ee=i.get(T);L.addEventListener("dispose",v);let ie=L.textures,ye=L.isWebGLCubeRenderTarget===!0,_e=ie.length>1;if(_e||(ee.__webglTexture===void 0&&(ee.__webglTexture=n.createTexture()),ee.__version=T.version,o.memory.textures++),ye){Y.__webglFramebuffer=[];for(let se=0;se<6;se++)if(T.mipmaps&&T.mipmaps.length>0){Y.__webglFramebuffer[se]=[];for(let oe=0;oe<T.mipmaps.length;oe++)Y.__webglFramebuffer[se][oe]=n.createFramebuffer()}else Y.__webglFramebuffer[se]=n.createFramebuffer()}else{if(T.mipmaps&&T.mipmaps.length>0){Y.__webglFramebuffer=[];for(let se=0;se<T.mipmaps.length;se++)Y.__webglFramebuffer[se]=n.createFramebuffer()}else Y.__webglFramebuffer=n.createFramebuffer();if(_e)for(let se=0,oe=ie.length;se<oe;se++){let Me=i.get(ie[se]);Me.__webglTexture===void 0&&(Me.__webglTexture=n.createTexture(),o.memory.textures++)}if(L.samples>0&&Dt(L)===!1){Y.__webglMultisampledFramebuffer=n.createFramebuffer(),Y.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,Y.__webglMultisampledFramebuffer);for(let se=0;se<ie.length;se++){let oe=ie[se];Y.__webglColorRenderbuffer[se]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,Y.__webglColorRenderbuffer[se]);let Me=r.convert(oe.format,oe.colorSpace),Ye=r.convert(oe.type),Ae=y(oe.internalFormat,Me,Ye,oe.normalized,oe.colorSpace,L.isXRRenderTarget===!0),we=_t(L);n.renderbufferStorageMultisample(n.RENDERBUFFER,we,Ae,L.width,L.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+se,n.RENDERBUFFER,Y.__webglColorRenderbuffer[se])}n.bindRenderbuffer(n.RENDERBUFFER,null),L.depthBuffer&&(Y.__webglDepthRenderbuffer=n.createRenderbuffer(),Ue(Y.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ye){t.bindTexture(n.TEXTURE_CUBE_MAP,ee.__webglTexture),re(n.TEXTURE_CUBE_MAP,T);for(let se=0;se<6;se++)if(T.mipmaps&&T.mipmaps.length>0)for(let oe=0;oe<T.mipmaps.length;oe++)ge(Y.__webglFramebuffer[se][oe],L,T,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+se,oe);else ge(Y.__webglFramebuffer[se],L,T,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0);m(T)&&b(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(_e){for(let se=0,oe=ie.length;se<oe;se++){let Me=ie[se],Ye=i.get(Me),Ae=n.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(Ae=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Ae,Ye.__webglTexture),re(Ae,Me),ge(Y.__webglFramebuffer,L,Me,n.COLOR_ATTACHMENT0+se,Ae,0),m(Me)&&b(Ae)}t.unbindTexture()}else{let se=n.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(se=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(se,ee.__webglTexture),re(se,T),T.mipmaps&&T.mipmaps.length>0)for(let oe=0;oe<T.mipmaps.length;oe++)ge(Y.__webglFramebuffer[oe],L,T,n.COLOR_ATTACHMENT0,se,oe);else ge(Y.__webglFramebuffer,L,T,n.COLOR_ATTACHMENT0,se,0);m(T)&&b(se),t.unbindTexture()}L.depthBuffer&&G(L)}function xe(L){let T=L.textures;for(let Y=0,ee=T.length;Y<ee;Y++){let ie=T[Y];if(m(ie)){let ye=w(L),_e=i.get(ie).__webglTexture;t.bindTexture(ye,_e),b(ye),t.unbindTexture()}}}let Ve=[],Je=[];function dt(L){if(L.samples>0){if(Dt(L)===!1){let T=L.textures,Y=L.width,ee=L.height,ie=n.COLOR_BUFFER_BIT,ye=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,_e=i.get(L),se=T.length>1;if(se)for(let Me=0;Me<T.length;Me++)t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,_e.__webglMultisampledFramebuffer);let oe=L.texture.mipmaps;oe&&oe.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,_e.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,_e.__webglFramebuffer);for(let Me=0;Me<T.length;Me++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(ie|=n.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(ie|=n.STENCIL_BUFFER_BIT)),se){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,_e.__webglColorRenderbuffer[Me]);let Ye=i.get(T[Me]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ye,0)}n.blitFramebuffer(0,0,Y,ee,0,0,Y,ee,ie,n.NEAREST),l===!0&&(Ve.length=0,Je.length=0,Ve.push(n.COLOR_ATTACHMENT0+Me),L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&(Ve.push(ye),Je.push(ye),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Je)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Ve))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),se)for(let Me=0;Me<T.length;Me++){t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.RENDERBUFFER,_e.__webglColorRenderbuffer[Me]);let Ye=i.get(T[Me]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.TEXTURE_2D,Ye,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,_e.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&l){let T=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[T])}}}function _t(L){return Math.min(s.maxSamples,L.samples)}function Dt(L){let T=i.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function V(L){let T=o.render.frame;u.get(L)!==T&&(u.set(L,T),L.update())}function on(L,T){let Y=L.colorSpace,ee=L.format,ie=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||Y!==xa&&Y!==Ss&&(bt.getTransfer(Y)===Lt?(ee!==Ln||ie!==ei)&&et("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):tt("WebGLTextures: Unsupported texture color space:",Y)),T}function At(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=W,this.resetTextureUnits=N,this.getTextureUnits=I,this.setTextureUnits=U,this.setTexture2D=te,this.setTexture2DArray=X,this.setTexture3D=q,this.setTextureCube=$,this.rebindTextures=me,this.setupRenderTarget=ke,this.updateRenderTargetMipmap=xe,this.updateMultisampleRenderTarget=dt,this.setupDepthRenderbuffer=G,this.setupFrameBufferTexture=ge,this.useMultisampledRTT=Dt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function r2(n,e){function t(i,s=Ss){let r,o=bt.getTransfer(s);if(i===ei)return n.UNSIGNED_BYTE;if(i===Bc)return n.UNSIGNED_SHORT_4_4_4_4;if(i===zc)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Pd)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Id)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Rd)return n.BYTE;if(i===Cd)return n.SHORT;if(i===Po)return n.UNSIGNED_SHORT;if(i===Fc)return n.INT;if(i===Fi)return n.UNSIGNED_INT;if(i===wi)return n.FLOAT;if(i===Bi)return n.HALF_FLOAT;if(i===Ld)return n.ALPHA;if(i===Dd)return n.RGB;if(i===Ln)return n.RGBA;if(i===ji)return n.DEPTH_COMPONENT;if(i===rr)return n.DEPTH_STENCIL;if(i===Hc)return n.RED;if(i===Gc)return n.RED_INTEGER;if(i===or)return n.RG;if(i===Vc)return n.RG_INTEGER;if(i===Wc)return n.RGBA_INTEGER;if(i===Ba||i===za||i===Ha||i===Ga)if(o===Lt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Ba)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===za)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ha)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ga)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Ba)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===za)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ha)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ga)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Xc||i===Yc||i===qc||i===$c)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===Xc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Yc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===qc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===$c)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Zc||i===Kc||i===Jc||i===jc||i===Qc||i===Va||i===eu)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Zc||i===Kc)return o===Lt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Jc)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(i===jc)return r.COMPRESSED_R11_EAC;if(i===Qc)return r.COMPRESSED_SIGNED_R11_EAC;if(i===Va)return r.COMPRESSED_RG11_EAC;if(i===eu)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===tu||i===nu||i===iu||i===su||i===ru||i===ou||i===au||i===lu||i===cu||i===uu||i===hu||i===du||i===fu||i===pu)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===tu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===nu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===iu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===su)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===ru)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ou)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===au)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===lu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===cu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===uu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===hu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===du)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===fu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===pu)return o===Lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===mu||i===gu||i===xu)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===mu)return o===Lt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===gu)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===xu)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===bu||i===yu||i===Wa||i===vu)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===bu)return r.COMPRESSED_RED_RGTC1_EXT;if(i===yu)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Wa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===vu)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Io?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var o2=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,a2=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,of=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new Ta(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new vn({vertexShader:o2,fragmentShader:a2,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new St(new di(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},af=class extends Qi{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,d=null,h=null,f=null,p=null,x=typeof XRWebGLBinding<"u",g=new of,m={},b=t.getContextAttributes(),w=null,y=null,_=[],M=[],A=new ft,v=null,S=null,C=new Pn;C.viewport=new $t;let P=new Pn;P.viewport=new $t;let D=[C,P],N=new Dc,I=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let z=_[k];return z===void 0&&(z=new To,_[k]=z),z.getTargetRaySpace()},this.getControllerGrip=function(k){let z=_[k];return z===void 0&&(z=new To,_[k]=z),z.getGripSpace()},this.getHand=function(k){let z=_[k];return z===void 0&&(z=new To,_[k]=z),z.getHandSpace()};function W(k){let z=M.indexOf(k.inputSource);if(z===-1)return;let de=_[z];de!==void 0&&(de.update(k.inputSource,k.frame,c||o),de.dispatchEvent({type:k.type,data:k.inputSource}))}function O(){s.removeEventListener("select",W),s.removeEventListener("selectstart",W),s.removeEventListener("selectend",W),s.removeEventListener("squeeze",W),s.removeEventListener("squeezestart",W),s.removeEventListener("squeezeend",W),s.removeEventListener("end",O),s.removeEventListener("inputsourceschange",te);for(let k=0;k<_.length;k++){let z=M[k];z!==null&&(M[k]=null,_[k].disconnect(z))}I=null,U=null,g.reset();for(let k in m)delete m[k];if(e.setRenderTarget(w),f=null,h=null,d=null,s=null,y=null,pe.stop(),i.isPresenting=!1,e.setPixelRatio(v),e.setSize(A.width,A.height,!1),S!==null){let k=S.camera;k.fov=S.fov,k.zoom=S.zoom,k.updateProjectionMatrix(),S=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){r=k,i.isPresenting===!0&&et("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){a=k,i.isPresenting===!0&&et("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(k){c=k},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return d===null&&x&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(k){if(s=k,s!==null){if(w=e.getRenderTarget(),s.addEventListener("select",W),s.addEventListener("selectstart",W),s.addEventListener("selectend",W),s.addEventListener("squeeze",W),s.addEventListener("squeezestart",W),s.addEventListener("squeezeend",W),s.addEventListener("end",O),s.addEventListener("inputsourceschange",te),b.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(A),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let de=null,Ee=null,ge=null;b.depth&&(ge=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,de=b.stencil?rr:ji,Ee=b.stencil?Io:Fi);let Ue={colorFormat:t.RGBA8,depthFormat:ge,scaleFactor:r};d=this.getBinding(),h=d.createProjectionLayer(Ue),s.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),y=new Jn(h.textureWidth,h.textureHeight,{format:Ln,type:ei,depthTexture:new js(h.textureWidth,h.textureHeight,Ee,void 0,void 0,void 0,void 0,void 0,void 0,de),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let de={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,de),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Jn(f.framebufferWidth,f.framebufferHeight,{format:Ln,type:ei,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),pe.setContext(s),pe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function te(k){for(let z=0;z<k.removed.length;z++){let de=k.removed[z],Ee=M.indexOf(de);Ee>=0&&(M[Ee]=null,_[Ee].disconnect(de))}for(let z=0;z<k.added.length;z++){let de=k.added[z],Ee=M.indexOf(de);if(Ee===-1){for(let Ue=0;Ue<_.length;Ue++)if(Ue>=M.length){M.push(de),Ee=Ue;break}else if(M[Ue]===null){M[Ue]=de,Ee=Ue;break}if(Ee===-1)break}let ge=_[Ee];ge&&ge.connect(de)}}let X=new Z,q=new Z;function $(k,z,de){X.setFromMatrixPosition(z.matrixWorld),q.setFromMatrixPosition(de.matrixWorld);let Ee=X.distanceTo(q),ge=z.projectionMatrix.elements,Ue=de.projectionMatrix.elements,vt=ge[14]/(ge[10]-1),G=ge[14]/(ge[10]+1),me=(ge[9]+1)/ge[5],ke=(ge[9]-1)/ge[5],xe=(ge[8]-1)/ge[0],Ve=(Ue[8]+1)/Ue[0],Je=vt*xe,dt=vt*Ve,_t=Ee/(-xe+Ve),Dt=_t*-xe;if(z.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(Dt),k.translateZ(_t),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert(),ge[10]===-1)k.projectionMatrix.copy(z.projectionMatrix),k.projectionMatrixInverse.copy(z.projectionMatrixInverse);else{let V=vt+_t,on=G+_t,At=Je-Dt,L=dt+(Ee-Dt),T=me*G/on*V,Y=ke*G/on*V;k.projectionMatrix.makePerspective(At,L,T,Y,V,on),k.projectionMatrixInverse.copy(k.projectionMatrix).invert()}}function he(k,z){z===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(z.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(s===null)return;let z=k.near,de=k.far;g.texture!==null&&(g.depthNear>0&&(z=g.depthNear),g.depthFar>0&&(de=g.depthFar)),N.near=P.near=C.near=z,N.far=P.far=C.far=de,(I!==N.near||U!==N.far)&&(s.updateRenderState({depthNear:N.near,depthFar:N.far}),I=N.near,U=N.far),N.layers.mask=k.layers.mask|6,C.layers.mask=N.layers.mask&-5,P.layers.mask=N.layers.mask&-3;let Ee=k.parent,ge=N.cameras;he(N,Ee);for(let Ue=0;Ue<ge.length;Ue++)he(ge[Ue],Ee);ge.length===2?$(N,C,P):N.projectionMatrix.copy(C.projectionMatrix),S===null&&k.isPerspectiveCamera&&(S={camera:k,fov:k.fov,zoom:k.zoom}),Q(k,N,Ee)};function Q(k,z,de){de===null?k.matrix.copy(z.matrixWorld):(k.matrix.copy(de.matrixWorld),k.matrix.invert(),k.matrix.multiply(z.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(z.projectionMatrix),k.projectionMatrixInverse.copy(z.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=Mo*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(h===null&&f===null))return l},this.setFoveation=function(k){l=k,h!==null&&(h.fixedFoveation=k),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=k)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(N)},this.getCameraTexture=function(k){return m[k]};let fe=null;function re(k,z){if(u=z.getViewerPose(c||o),p=z,u!==null){let de=u.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let Ee=!1;de.length!==N.cameras.length&&(N.cameras.length=0,Ee=!0);for(let G=0;G<de.length;G++){let me=de[G],ke=null;if(f!==null)ke=f.getViewport(me);else{let Ve=d.getViewSubImage(h,me);ke=Ve.viewport,G===0&&(e.setRenderTargetTextures(y,Ve.colorTexture,Ve.depthStencilTexture),e.setRenderTarget(y))}let xe=D[G];xe===void 0&&(xe=new Pn,xe.layers.enable(G),xe.viewport=new $t,D[G]=xe),xe.matrix.fromArray(me.transform.matrix),xe.matrix.decompose(xe.position,xe.quaternion,xe.scale),xe.projectionMatrix.fromArray(me.projectionMatrix),xe.projectionMatrixInverse.copy(xe.projectionMatrix).invert(),xe.viewport.set(ke.x,ke.y,ke.width,ke.height),G===0&&(N.matrix.copy(xe.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Ee===!0&&N.cameras.push(xe)}let ge=s.enabledFeatures;if(ge&&ge.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){d=i.getBinding();let G=d.getDepthInformation(de[0]);G&&G.isValid&&G.texture&&g.init(G,s.renderState)}if(ge&&ge.includes("camera-access")&&x){e.state.unbindTexture(),d=i.getBinding();for(let G=0;G<de.length;G++){let me=de[G].camera;if(me){let ke=m[me];ke||(ke=new Ta,m[me]=ke);let xe=d.getCameraImage(me);ke.sourceTexture=xe}}}}for(let de=0;de<_.length;de++){let Ee=M[de],ge=_[de];Ee!==null&&ge!==void 0&&ge.update(Ee,z,c||o)}fe&&fe(k,z),z.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:z}),p=null}let pe=new S0;pe.setAnimationLoop(re),this.setAnimationLoop=function(k){fe=k},this.dispose=function(){}}},l2=new gt,P0=new it;P0.set(-1,0,0,0,1,0,0,0,1);function c2(n,e){function t(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function i(g,m){m.color.getRGB(g.fogColor.value,Od(n)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function s(g,m,b,w,y){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(g,m):m.isMeshLambertMaterial?(r(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(g,m),d(g,m)):m.isMeshPhongMaterial?(r(g,m),u(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(g,m),h(g,m),m.isMeshPhysicalMaterial&&f(g,m,y)):m.isMeshMatcapMaterial?(r(g,m),p(g,m)):m.isMeshDepthMaterial?r(g,m):m.isMeshDistanceMaterial?(r(g,m),x(g,m)):m.isMeshNormalMaterial?r(g,m):m.isLineBasicMaterial?(o(g,m),m.isLineDashedMaterial&&a(g,m)):m.isPointsMaterial?l(g,m,b,w):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,t(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===Gn&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,t(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===Gn&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,t(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,t(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);let b=e.get(m),w=b.envMap,y=b.envMapRotation;w&&(g.envMap.value=w,g.envMapRotation.value.setFromMatrix4(l2.makeRotationFromEuler(y)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(P0),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,g.aoMapTransform))}function o(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform))}function a(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,b,w){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*b,g.scale.value=w*.5,m.map&&(g.map.value=m.map,t(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function u(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function d(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function h(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,b){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Gn&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.retroreflectivity>0&&(g.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=b.texture,g.transmissionSamplerSize.value.set(b.width,b.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function x(g,m){let b=e.get(m).light;g.referencePosition.value.setFromMatrixPosition(b.matrixWorld),g.nearDistance.value=b.shadow.camera.near,g.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function u2(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,_){let M=_.program;i.uniformBlockBinding(y,M)}function c(y,_){let M=s[y.id];M===void 0&&(g(y),M=u(y),s[y.id]=M,y.addEventListener("dispose",b));let A=_.program;i.updateUBOMapping(y,A);let v=e.render.frame;r[y.id]!==v&&(h(y),r[y.id]=v)}function u(y){let _=d();y.__bindingPointIndex=_;let M=n.createBuffer(),A=y.__size,v=y.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,A,v),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,_,M),M}function d(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return tt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(y){let _=s[y.id],M=y.uniforms,A=y.__cache;n.bindBuffer(n.UNIFORM_BUFFER,_);for(let v=0,S=M.length;v<S;v++){let C=M[v];if(Array.isArray(C))for(let P=0,D=C.length;P<D;P++)f(C[P],v,P,A);else f(C,v,0,A)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(y,_,M,A){if(x(y,_,M,A)===!0){let v=y.__offset,S=y.value;if(Array.isArray(S)){let C=0;for(let P=0;P<S.length;P++){let D=S[P],N=m(D);p(D,y.__data,C),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(C+=N.storage/Float32Array.BYTES_PER_ELEMENT)}}else p(S,y.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,v,y.__data)}}function p(y,_,M){typeof y=="number"||typeof y=="boolean"?_[0]=y:y.isMatrix3?(_[0]=y.elements[0],_[1]=y.elements[1],_[2]=y.elements[2],_[3]=0,_[4]=y.elements[3],_[5]=y.elements[4],_[6]=y.elements[5],_[7]=0,_[8]=y.elements[6],_[9]=y.elements[7],_[10]=y.elements[8],_[11]=0):ArrayBuffer.isView(y)?_.set(new y.constructor(y.buffer,y.byteOffset,_.length)):y.toArray(_,M)}function x(y,_,M,A){let v=y.value,S=_+"_"+M;if(A[S]===void 0)return typeof v=="number"||typeof v=="boolean"?A[S]=v:ArrayBuffer.isView(v)?A[S]=v.slice():A[S]=v.clone(),!0;{let C=A[S];if(typeof v=="number"||typeof v=="boolean"){if(C!==v)return A[S]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(C.equals(v)===!1)return C.copy(v),!0}}return!1}function g(y){let _=y.uniforms,M=0,A=16;for(let S=0,C=_.length;S<C;S++){let P=Array.isArray(_[S])?_[S]:[_[S]];for(let D=0,N=P.length;D<N;D++){let I=P[D],U=Array.isArray(I.value)?I.value:[I.value];for(let W=0,O=U.length;W<O;W++){let te=U[W],X=m(te),q=M%A,$=q%X.boundary,he=q+$;M+=$,he!==0&&A-he<X.storage&&(M+=A-he),I.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=M,M+=X.storage}}}let v=M%A;return v>0&&(M+=A-v),y.__size=M,y.__cache={},this}function m(y){let _={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(_.boundary=4,_.storage=4):y.isVector2?(_.boundary=8,_.storage=8):y.isVector3||y.isColor?(_.boundary=16,_.storage=12):y.isVector4?(_.boundary=16,_.storage=16):y.isMatrix3?(_.boundary=48,_.storage=48):y.isMatrix4?(_.boundary=64,_.storage=64):y.isTexture?et("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(_.boundary=16,_.storage=y.byteLength):et("WebGLRenderer: Unsupported uniform value type.",y),_}function b(y){let _=y.target;_.removeEventListener("dispose",b);let M=o.indexOf(_.__bindingPointIndex);o.splice(M,1),n.deleteBuffer(s[_.id]),delete s[_.id],delete r[_.id]}function w(){for(let y in s)n.deleteBuffer(s[y]);o=[],s={},r={}}return{bind:l,update:c,dispose:w}}var h2=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ss=null;function d2(){return ss===null&&(ss=new ws(h2,16,16,or,Bi),ss.name="DFG_LUT",ss.minFilter=qt,ss.magFilter=qt,ss.wrapS=Kn,ss.wrapT=Kn,ss.generateMipmaps=!1,ss.needsUpdate=!0),ss}var Ru=class{constructor(e={}){let{canvas:t=Zm(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1,outputBufferType:f=ei}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;let x=f,g=new Set([Wc,Vc,Gc]),m=new Set([ei,Fi,Po,Io,Bc,zc]),b=new Uint32Array(4),w=new Int32Array(4),y=new Z,_=null,M=null,A=[],v=[],S=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Oi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let C=this,P=!1,D=null,N=null,I=null,U=null;this._outputColorSpace=Wt;let W=0,O=0,te=null,X=-1,q=null,$=new $t,he=new $t,Q=null,fe=new Re(0),re=0,pe=t.width,k=t.height,z=1,de=null,Ee=null,ge=new $t(0,0,pe,k),Ue=new $t(0,0,pe,k),vt=!1,G=new Eo,me=!1,ke=!1,xe=new gt,Ve=new Z,Je=new $t,dt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},_t=!1;function Dt(){return te===null?z:1}let V=i;function on(R,B){return t.getContext(R,B)}let At,L,T,Y,ee,ie,ye,_e,se,oe,Me,Ye,Ae,we,Xe,je,rt,H,Se,ce,Te,Ce,ae;try{let R={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",Ct,!1),t.addEventListener("webglcontextrestored",pt,!1),t.addEventListener("webglcontextcreationerror",Zn,!1),V===null){let B="webgl2";if(V=on(B,R),V===null)throw on(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Be()}catch(R){throw t.removeEventListener("webglcontextlost",Ct,!1),t.removeEventListener("webglcontextrestored",pt,!1),t.removeEventListener("webglcontextcreationerror",Zn,!1),tt("WebGLRenderer: "+R.message),R}function Be(){At=new yM(V),At.init(),Te=new r2(V,At),L=new cM(V,At,e,Te),T=new i2(V,At),L.reversedDepthBuffer&&h&&T.buffers.depth.setReversed(!0),N=V.createFramebuffer(),I=V.createFramebuffer(),U=V.createFramebuffer(),Y=new MM(V),ee=new Vw,ie=new s2(V,At,T,ee,L,Te,Y),ye=new bM(C),_e=new Sy(V),Ce=new aM(V,_e),se=new vM(V,_e,Y,Ce),oe=new SM(V,se,_e,Ce,Y),H=new wM(V,L,ie),Xe=new uM(ee),Me=new Gw(C,ye,At,L,Ce,Xe),Ye=new c2(C,ee),Ae=new Xw,we=new Jw(At),rt=new oM(C,ye,T,oe,p,l),je=new n2(C,oe,L),ae=new u2(V,Y,L,T),Se=new lM(V,At,Y),ce=new _M(V,At,Y),Y.programs=Me.programs,C.capabilities=L,C.extensions=At,C.properties=ee,C.renderLists=Ae,C.shadowMap=je,C.state=T,C.info=Y}x!==ei&&(S=new EM(x,t.width,t.height,a,s,r));let Oe=new af(C,V);this.xr=Oe,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let R=At.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){let R=At.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(R){R!==void 0&&(z=R,this.setSize(pe,k,!1))},this.getSize=function(R){return R.set(pe,k)},this.setSize=function(R,B,ne=!0){if(Oe.isPresenting){et("WebGLRenderer: Can't change size while VR device is presenting.");return}pe=R,k=B,t.width=Math.floor(R*z),t.height=Math.floor(B*z),ne===!0&&(t.style.width=R+"px",t.style.height=B+"px"),S!==null&&S.setSize(t.width,t.height),this.setViewport(0,0,R,B)},this.getDrawingBufferSize=function(R){return R.set(pe*z,k*z).floor()},this.setDrawingBufferSize=function(R,B,ne){pe=R,k=B,z=ne,t.width=Math.floor(R*ne),t.height=Math.floor(B*ne),this.setViewport(0,0,R,B)},this.setEffects=function(R){if(x===ei){tt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(R){for(let B=0;B<R.length;B++)if(R[B].isOutputPass===!0){et("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}S.setEffects(R||[])},this.getCurrentViewport=function(R){return R.copy($)},this.getViewport=function(R){return R.copy(ge)},this.setViewport=function(R,B,ne,J){R.isVector4?ge.set(R.x,R.y,R.z,R.w):ge.set(R,B,ne,J),T.viewport($.copy(ge).multiplyScalar(z).round())},this.getScissor=function(R){return R.copy(Ue)},this.setScissor=function(R,B,ne,J){R.isVector4?Ue.set(R.x,R.y,R.z,R.w):Ue.set(R,B,ne,J),T.scissor(he.copy(Ue).multiplyScalar(z).round())},this.getScissorTest=function(){return vt},this.setScissorTest=function(R){T.setScissorTest(vt=R)},this.setOpaqueSort=function(R){de=R},this.setTransparentSort=function(R){Ee=R},this.getClearColor=function(R){return R.copy(rt.getClearColor())},this.setClearColor=function(){rt.setClearColor(...arguments)},this.getClearAlpha=function(){return rt.getClearAlpha()},this.setClearAlpha=function(){rt.setClearAlpha(...arguments)},this.clear=function(R=!0,B=!0,ne=!0){let J=0;if(R){let j=!1;if(te!==null){let Le=te.texture.format;j=g.has(Le)}if(j){let Le=te.texture.type,Fe=m.has(Le),Ie=rt.getClearColor(),He=rt.getClearAlpha(),$e=Ie.r,ut=Ie.g,mt=Ie.b;Fe?(b[0]=$e,b[1]=ut,b[2]=mt,b[3]=He,V.clearBufferuiv(V.COLOR,0,b)):(w[0]=$e,w[1]=ut,w[2]=mt,w[3]=He,V.clearBufferiv(V.COLOR,0,w))}else J|=V.COLOR_BUFFER_BIT}B&&(J|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ne&&(J|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),J!==0&&V.clear(J)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(R){R.setRenderer(this),D=R},this.dispose=function(){t.removeEventListener("webglcontextlost",Ct,!1),t.removeEventListener("webglcontextrestored",pt,!1),t.removeEventListener("webglcontextcreationerror",Zn,!1),rt.dispose(),Ae.dispose(),we.dispose(),ee.dispose(),ye.dispose(),oe.dispose(),Ce.dispose(),ae.dispose(),Me.dispose(),Oe.dispose(),Oe.removeEventListener("sessionstart",wt),Oe.removeEventListener("sessionend",Os),li.stop()};function Ct(R){R.preventDefault(),Nd("WebGLRenderer: Context Lost."),P=!0}function pt(){Nd("WebGLRenderer: Context Restored."),P=!1;let R=Y.autoReset,B=je.enabled,ne=je.autoUpdate,J=je.needsUpdate,j=je.type;Be(),Y.autoReset=R,je.enabled=B,je.autoUpdate=ne,je.needsUpdate=J,je.type=j}function Zn(R){tt("WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function F(R){let B=R.target;B.removeEventListener("dispose",F),le(B)}function le(R){ze(R),ee.remove(R)}function ze(R){let B=ee.get(R).programs;B!==void 0&&(B.forEach(function(ne){Me.releaseProgram(ne)}),R.isShaderMaterial&&Me.releaseShaderCache(R))}this.renderBufferDirect=function(R,B,ne,J,j,Le){B===null&&(B=dt);let Fe=j.isMesh&&j.matrixWorld.determinantAffine()<0,Ie=Nl(R,B,ne,J,j);T.setMaterial(J,Fe);let He=ne.index,$e=1;if(J.wireframe===!0){if(He=se.getWireframeAttribute(ne),He===void 0)return;$e=2}let ut=ne.drawRange,mt=ne.attributes.position,Ge=ut.start*$e,It=(ut.start+ut.count)*$e;Le!==null&&(Ge=Math.max(Ge,Le.start*$e),It=Math.min(It,(Le.start+Le.count)*$e)),He!==null?(Ge=Math.max(Ge,0),It=Math.min(It,He.count)):mt!=null&&(Ge=Math.max(Ge,0),It=Math.min(It,mt.count));let an=It-Ge;if(an<0||an===1/0)return;Ce.setup(j,J,Ie,ne,He);let Gt,Ft=Se;if(He!==null&&(Gt=_e.get(He),Ft=ce,Ft.setIndex(Gt)),j.isMesh)J.wireframe===!0?(T.setLineWidth(J.wireframeLinewidth*Dt()),Ft.setMode(V.LINES)):Ft.setMode(V.TRIANGLES);else if(j.isLine){let An=J.linewidth;An===void 0&&(An=1),T.setLineWidth(An*Dt()),j.isLineSegments?Ft.setMode(V.LINES):j.isLineLoop?Ft.setMode(V.LINE_LOOP):Ft.setMode(V.LINE_STRIP)}else j.isPoints?Ft.setMode(V.POINTS):j.isSprite&&Ft.setMode(V.TRIANGLES);if(j.isBatchedMesh)if(At.get("WEBGL_multi_draw"))Ft.renderMultiDraw(j._multiDrawStarts,j._multiDrawCounts,j._multiDrawCount);else{let An=j._multiDrawStarts,Ne=j._multiDrawCounts,Fn=j._multiDrawCount,Mt=He?_e.get(He).bytesPerElement:1,vi=ee.get(J).currentProgram.getUniforms();for(let Ki=0;Ki<Fn;Ki++)vi.setValue(V,"_gl_DrawID",Ki),Ft.render(An[Ki]/Mt,Ne[Ki])}else if(j.isInstancedMesh)Ft.renderInstances(Ge,an,j.count);else if(ne.isInstancedBufferGeometry){let An=ne._maxInstanceCount!==void 0?ne._maxInstanceCount:1/0,Ne=Math.min(ne.instanceCount,An);Ft.renderInstances(Ge,an,Ne)}else Ft.render(Ge,an)};function qe(R,B,ne,J){D!==null&&R.isNodeMaterial&&D.setObject(J,R),me===!0&&Xe.setState(R,ne,!1),R.transparent===!0&&R.side===Vn&&R.forceSinglePass===!1?(R.side=Gn,R.needsUpdate=!0,Bs(R,B,J),R.side=ir,R.needsUpdate=!0,Bs(R,B,J),R.side=Vn):Bs(R,B,J)}this.compile=function(R,B,ne=null){ne===null&&(ne=R),D!==null&&D.renderStart(R,B,ne),M=we.get(ne),M.init(B),v.push(M),ne.traverseVisible(function(j){j.isLight&&j.layers.test(B.layers)&&(M.pushLight(j),j.castShadow&&M.pushShadow(j))}),R!==ne&&R.traverseVisible(function(j){j.isLight&&j.layers.test(B.layers)&&(M.pushLight(j),j.castShadow&&M.pushShadow(j))}),M.setupLights(),D!==null&&D.updateLights(M.state.lightsArray),ke=this.localClippingEnabled,me=Xe.init(this.clippingPlanes,ke),me===!0&&Xe.setGlobalState(this.clippingPlanes,B),D!==null&&je.render(M.state.shadowsArray,ne,B);let J=new Set;return R.traverse(function(j){if(!(j.isMesh||j.isPoints||j.isLine||j.isSprite))return;let Le=j.material;if(Le)if(Array.isArray(Le))for(let Fe=0;Fe<Le.length;Fe++){let Ie=Le[Fe];qe(Ie,ne,B,j),J.add(Ie)}else qe(Le,ne,B,j),J.add(Le)}),M=v.pop(),D!==null&&D.renderEnd(),J},this.compileAsync=function(R,B,ne=null){let J=this.compile(R,B,ne);return new Promise(j=>{function Le(){if(J.forEach(function(Fe){let He=ee.get(Fe).currentProgram;(He===void 0||He.isReady())&&J.delete(Fe)}),J.size===0){j(R);return}setTimeout(Le,10)}At.get("KHR_parallel_shader_compile")!==null?Le():setTimeout(Le,10)})};let lt=null;function Pt(R){lt&&lt(R)}function wt(){li.stop()}function Os(){li.start()}let li=new S0;li.setAnimationLoop(Pt),typeof self<"u"&&li.setContext(self),this.setAnimationLoop=function(R){lt=R,Oe.setAnimationLoop(R),R===null?li.stop():li.start()},Oe.addEventListener("sessionstart",wt),Oe.addEventListener("sessionend",Os),this.render=function(R,B){if(B!==void 0&&B.isCamera!==!0){tt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;D!==null&&D.renderStart(R,B);let ne=Oe.enabled===!0&&Oe.isPresenting===!0,J=S!==null&&(te===null||ne)&&S.begin(C,te);if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),Oe.enabled===!0&&Oe.isPresenting===!0&&(S===null||S.isCompositing()===!1)&&(Oe.cameraAutoUpdate===!0&&Oe.updateCamera(B),B=Oe.getCamera()),R.isScene===!0&&R.onBeforeRender(C,R,B,te),M=we.get(R,v.length),M.init(B),M.state.textureUnits=ie.getTextureUnits(),v.push(M),xe.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),G.setFromProjectionMatrix(xe,Ni,B.reversedDepth),ke=this.localClippingEnabled,me=Xe.init(this.clippingPlanes,ke),_=Ae.get(R,A.length),_.init(),A.push(_),Oe.enabled===!0&&Oe.isPresenting===!0){let Fe=C.xr.getDepthSensingMesh();Fe!==null&&Ii(Fe,B,-1/0,C.sortObjects)}Ii(R,B,0,C.sortObjects),_.finish(),D!==null&&D.updateLights(M.state.lightsArray),C.sortObjects===!0&&_.sort(de,Ee),_t=Oe.enabled===!1||Oe.isPresenting===!1||Oe.hasDepthSensing()===!1,_t&&rt.addToRenderList(_,R),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),me===!0&&Xe.beginShadows();let j=M.state.shadowsArray;if(je.render(j,R,B),me===!0&&Xe.endShadows(),(J&&S.hasRenderPass())===!1){let Fe=_.opaque,Ie=_.transmissive;if(M.setupLights(),B.isArrayCamera){let He=B.cameras;if(Ie.length>0)for(let $e=0,ut=He.length;$e<ut;$e++){let mt=He[$e];Mr(Fe,Ie,R,mt)}_t&&rt.render(R);for(let $e=0,ut=He.length;$e<ut;$e++){let mt=He[$e];Kr(_,R,mt,mt.viewport)}}else Ie.length>0&&Mr(Fe,Ie,R,B),_t&&rt.render(R),Kr(_,R,B)}te!==null&&O===0&&(ie.updateMultisampleRenderTarget(te),ie.updateRenderTargetMipmap(te)),J&&S.end(C),R.isScene===!0&&R.onAfterRender(C,R,B),Ce.resetDefaultState(),X=-1,q=null,v.pop(),v.length>0?(M=v[v.length-1],ie.setTextureUnits(M.state.textureUnits),me===!0&&Xe.setGlobalState(C.clippingPlanes,M.state.camera)):M=null,A.pop(),A.length>0?_=A[A.length-1]:_=null,D!==null&&D.renderEnd()};function Ii(R,B,ne,J){if(R.visible===!1)return;if(R.layers.test(B.layers)){if(R.isGroup)ne=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(B);else if(R.isLightProbeGrid)M.pushLightProbeGrid(R);else if(R.isLight)M.pushLight(R),R.castShadow&&M.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||R.intersectsFrustum(G)){J&&Je.setFromMatrixPosition(R.matrixWorld).applyMatrix4(xe);let Fe=oe.update(R),Ie=R.material;Ie.visible&&_.push(R,Fe,Ie,ne,Je.z,null,B)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||R.intersectsFrustum(G))){let Fe=oe.update(R),Ie=R.material;if(J&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),Je.copy(R.boundingSphere.center)):(Fe.boundingSphere===null&&Fe.computeBoundingSphere(),Je.copy(Fe.boundingSphere.center)),Je.applyMatrix4(R.matrixWorld).applyMatrix4(xe)),Array.isArray(Ie)){let He=Fe.groups;for(let $e=0,ut=He.length;$e<ut;$e++){let mt=He[$e],Ge=Ie[mt.materialIndex];Ge&&Ge.visible&&_.push(R,Fe,Ge,ne,Je.z,mt,B)}}else Ie.visible&&_.push(R,Fe,Ie,ne,Je.z,null,B)}}let Le=R.children;for(let Fe=0,Ie=Le.length;Fe<Ie;Fe++)Ii(Le[Fe],B,ne,J)}function Kr(R,B,ne,J){let{opaque:j,transmissive:Le,transparent:Fe}=R;M.setupLightsView(ne),me===!0&&Xe.setGlobalState(C.clippingPlanes,ne),J&&T.viewport($.copy(J)),j.length>0&&Fs(j,B,ne),Le.length>0&&Fs(Le,B,ne),Fe.length>0&&Fs(Fe,B,ne),T.buffers.depth.setTest(!0),T.buffers.depth.setMask(!0),T.buffers.color.setMask(!0),T.setPolygonOffset(!1)}function Mr(R,B,ne,J){if((ne.isScene===!0?ne.overrideMaterial:null)!==null)return;if(M.state.transmissionRenderTarget[J.id]===void 0){let Ge=At.has("EXT_color_buffer_half_float")||At.has("EXT_color_buffer_float");M.state.transmissionRenderTarget[J.id]=new Jn(1,1,{generateMipmaps:!0,type:Ge?Bi:ei,minFilter:Mi,samples:Math.max(4,L.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:bt.workingColorSpace})}let Le=M.state.transmissionRenderTarget[J.id],Fe=J.viewport||$;Le.setSize(Fe.z*C.transmissionResolutionScale,Fe.w*C.transmissionResolutionScale);let Ie=C.getRenderTarget(),He=C.getActiveCubeFace(),$e=C.getActiveMipmapLevel();C.setRenderTarget(Le),C.getClearColor(fe),re=C.getClearAlpha(),re<1&&C.setClearColor(16777215,.5),C.clear(),_t&&rt.render(ne);let ut=C.toneMapping;C.toneMapping=Oi;let mt=J.viewport;if(J.viewport!==void 0&&(J.viewport=void 0),M.setupLightsView(J),me===!0&&Xe.setGlobalState(C.clippingPlanes,J),Fs(R,ne,J),ie.updateMultisampleRenderTarget(Le),ie.updateRenderTargetMipmap(Le),At.has("WEBGL_multisampled_render_to_texture")===!1){let Ge=!1;for(let It=0,an=B.length;It<an;It++){let Gt=B[It],{object:Ft,geometry:An,material:Ne,group:Fn}=Gt;if(Ne.side===Vn&&Ft.layers.test(J.layers)){let Mt=Ne.side;Ne.side=Gn,Ne.needsUpdate=!0,Jr(Ft,ne,J,An,Ne,Fn),Ne.side=Mt,Ne.needsUpdate=!0,Ge=!0}}Ge===!0&&(ie.updateMultisampleRenderTarget(Le),ie.updateRenderTargetMipmap(Le))}C.setRenderTarget(Ie,He,$e),C.setClearColor(fe,re),mt!==void 0&&(J.viewport=mt),C.toneMapping=ut}function Fs(R,B,ne){let J=B.isScene===!0?B.overrideMaterial:null;for(let j=0,Le=R.length;j<Le;j++){let Fe=R[j],{object:Ie,geometry:He,group:$e}=Fe,ut=Fe.material;ut.allowOverride===!0&&J!==null&&(ut=J),Ie.layers.test(ne.layers)&&Jr(Ie,B,ne,He,ut,$e)}}function Jr(R,B,ne,J,j,Le){D!==null&&j.isNodeMaterial&&D.setObject(R,j),R.onBeforeRender(C,B,ne,J,j,Le),R.modelViewMatrix.multiplyMatrices(ne.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),j.onBeforeRender(C,B,ne,J,R,Le),j.transparent===!0&&j.side===Vn&&j.forceSinglePass===!1?(j.side=Gn,j.needsUpdate=!0,C.renderBufferDirect(ne,B,J,j,R,Le),j.side=ir,j.needsUpdate=!0,C.renderBufferDirect(ne,B,J,j,R,Le),j.side=Vn):C.renderBufferDirect(ne,B,J,j,R,Le),R.onAfterRender(C,B,ne,J,j,Le)}function Bs(R,B,ne){B.isScene!==!0&&(B=dt);let J=ee.get(R),j=M.state.lights,Le=M.state.shadowsArray,Fe=j.state.version,Ie=Me.getParameters(R,j.state,Le,B,ne,M.state.lightProbeGridArray),He=Me.getProgramCacheKey(Ie),$e=J.programs;J.environment=R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial?B.environment:null,J.fog=B.fog;let ut=R.isMeshStandardMaterial||R.isMeshLambertMaterial&&!R.envMap||R.isMeshPhongMaterial&&!R.envMap;J.envMap=ye.get(R.envMap||J.environment,ut),J.envMapRotation=J.environment!==null&&R.envMap===null?B.environmentRotation:R.envMapRotation,$e===void 0&&(R.addEventListener("dispose",F),$e=new Map,J.programs=$e);let mt=$e.get(He);if(mt!==void 0){if(J.currentProgram===mt&&J.lightsStateVersion===Fe)return Qr(R,Ie),mt}else Ie.uniforms=Me.getUniforms(R),D!==null&&R.isNodeMaterial&&D.build(R,ne,Ie),R.onBeforeCompile(Ie,C),mt=Me.acquireProgram(Ie,He),$e.set(He,mt),J.uniforms=Ie.uniforms;let Ge=J.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(Ge.clippingPlanes=Xe.uniform),Qr(R,Ie),J.needsLights=T1(R),J.lightsStateVersion=Fe,J.needsLights&&(Ge.ambientLightColor.value=j.state.ambient,Ge.lightProbe.value=j.state.probe,Ge.sunLights.value=j.state.sun,Ge.sunLightShadows.value=j.state.sunShadow,Ge.directionalLights.value=j.state.directional,Ge.directionalLightShadows.value=j.state.directionalShadow,Ge.spotLights.value=j.state.spot,Ge.spotLightShadows.value=j.state.spotShadow,Ge.rectAreaLights.value=j.state.rectArea,Ge.ltc_1.value=j.state.rectAreaLTC1,Ge.ltc_2.value=j.state.rectAreaLTC2,Ge.pointLights.value=j.state.point,Ge.pointLightShadows.value=j.state.pointShadow,Ge.hemisphereLights.value=j.state.hemi,Ge.sunShadowMatrix.value=j.state.sunShadowMatrix,Ge.sunShadowCascade.value=j.state.sunShadowCascade,Ge.directionalShadowMatrix.value=j.state.directionalShadowMatrix,Ge.spotLightMatrix.value=j.state.spotLightMatrix,Ge.spotLightMap.value=j.state.spotLightMap,Ge.pointShadowMatrix.value=j.state.pointShadowMatrix),J.lightProbeGrid=M.state.lightProbeGridArray.length>0,J.currentProgram=mt,J.uniformsList=null,mt}function jr(R){if(R.uniformsList===null){let B=R.currentProgram.getUniforms();R.uniformsList=No.seqWithValue(B.seq,R.uniforms)}return R.uniformsList}function Qr(R,B){let ne=ee.get(R);ne.outputColorSpace=B.outputColorSpace,ne.batching=B.batching,ne.batchingColor=B.batchingColor,ne.instancing=B.instancing,ne.instancingColor=B.instancingColor,ne.instancingMorph=B.instancingMorph,ne.skinning=B.skinning,ne.morphTargets=B.morphTargets,ne.morphNormals=B.morphNormals,ne.morphColors=B.morphColors,ne.morphTargetsCount=B.morphTargetsCount,ne.numClippingPlanes=B.numClippingPlanes,ne.numIntersection=B.numClipIntersection,ne.vertexAlphas=B.vertexAlphas,ne.vertexTangents=B.vertexTangents,ne.toneMapping=B.toneMapping}function aa(R,B){if(R.length===0)return null;if(R.length===1)return R[0].texture!==null?R[0]:null;y.setFromMatrixPosition(B.matrixWorld);for(let ne=0,J=R.length;ne<J;ne++){let j=R[ne];if(j.texture!==null&&j.boundingBox.containsPoint(y))return j}return null}function Nl(R,B,ne,J,j){B.isScene!==!0&&(B=dt),ie.resetTextureUnits();let Le=B.fog,Fe=J.isMeshStandardMaterial||J.isMeshLambertMaterial||J.isMeshPhongMaterial?B.environment:null,Ie=te===null?C.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:bt.workingColorSpace,He=J.isMeshStandardMaterial||J.isMeshLambertMaterial&&!J.envMap||J.isMeshPhongMaterial&&!J.envMap,$e=ye.get(J.envMap||Fe,He),ut=J.vertexColors===!0&&!!ne.attributes.color&&ne.attributes.color.itemSize===4,mt=!!ne.attributes.tangent&&(!!J.normalMap||J.anisotropy>0),Ge=!!ne.morphAttributes.position,It=!!ne.morphAttributes.normal,an=!!ne.morphAttributes.color,Gt=Oi;J.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(Gt=C.toneMapping);let Ft=ne.morphAttributes.position||ne.morphAttributes.normal||ne.morphAttributes.color,An=Ft!==void 0?Ft.length:0,Ne=ee.get(J),Fn=M.state.lights;if(me===!0&&(ke===!0||R!==q)){let Bt=R===q&&J.id===X;Xe.setState(J,R,Bt)}let Mt=!1;J.version===Ne.__version?(Ne.needsLights&&Ne.lightsStateVersion!==Fn.state.version||Ne.outputColorSpace!==Ie||j.isBatchedMesh&&Ne.batching===!1||!j.isBatchedMesh&&Ne.batching===!0||j.isBatchedMesh&&Ne.batchingColor===!0&&j._colorsTexture===null||j.isBatchedMesh&&Ne.batchingColor===!1&&j._colorsTexture!==null||j.isInstancedMesh&&Ne.instancing===!1||!j.isInstancedMesh&&Ne.instancing===!0||j.isSkinnedMesh&&Ne.skinning===!1||!j.isSkinnedMesh&&Ne.skinning===!0||j.isInstancedMesh&&Ne.instancingColor===!0&&j.instanceColor===null||j.isInstancedMesh&&Ne.instancingColor===!1&&j.instanceColor!==null||j.isInstancedMesh&&Ne.instancingMorph===!0&&j.morphTexture===null||j.isInstancedMesh&&Ne.instancingMorph===!1&&j.morphTexture!==null||Ne.envMap!==$e||J.fog===!0&&Ne.fog!==Le||Ne.numClippingPlanes!==void 0&&(Ne.numClippingPlanes!==Xe.numPlanes||Ne.numIntersection!==Xe.numIntersection)||Ne.vertexAlphas!==ut||Ne.vertexTangents!==mt||Ne.morphTargets!==Ge||Ne.morphNormals!==It||Ne.morphColors!==an||Ne.toneMapping!==Gt||Ne.morphTargetsCount!==An||!!Ne.lightProbeGrid!=M.state.lightProbeGridArray.length>0)&&(Mt=!0):(Mt=!0,Ne.__version=J.version);let vi=Ne.currentProgram;Mt===!0&&(vi=Bs(J,B,j),D&&J.isNodeMaterial&&D.onUpdateProgram(J,vi,Ne));let Ki=!1,zs=!1,eo=!1,Nt=vi.getUniforms(),tn=Ne.uniforms;if(T.useProgram(vi.program)&&(Ki=!0,zs=!0,eo=!0),J.id!==X&&(X=J.id,zs=!0),Ne.needsLights){let Bt=aa(M.state.lightProbeGridArray,j);Ne.lightProbeGrid!==Bt&&(Ne.lightProbeGrid=Bt,zs=!0)}if(Ki||q!==R){T.buffers.depth.getReversed()&&R.reversedDepth!==!0&&(R._reversedDepth=!0,R.updateProjectionMatrix()),Nt.setValue(V,"projectionMatrix",R.projectionMatrix),Nt.setValue(V,"viewMatrix",R.matrixWorldInverse);let Gs=Nt.map.cameraPosition;Gs!==void 0&&Gs.setValue(V,Ve.setFromMatrixPosition(R.matrixWorld)),L.logarithmicDepthBuffer&&Nt.setValue(V,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(J.isMeshPhongMaterial||J.isMeshToonMaterial||J.isMeshLambertMaterial||J.isMeshBasicMaterial||J.isMeshStandardMaterial||J.isShaderMaterial)&&Nt.setValue(V,"isOrthographic",R.isOrthographicCamera===!0),q!==R&&(q=R,zs=!0,eo=!0)}if(Ne.needsLights&&(Fn.state.sunShadowMap.length>0&&Nt.setValue(V,"sunShadowMap",Fn.state.sunShadowMap,ie),Fn.state.directionalShadowMap.length>0&&Nt.setValue(V,"directionalShadowMap",Fn.state.directionalShadowMap,ie),Fn.state.spotShadowMap.length>0&&Nt.setValue(V,"spotShadowMap",Fn.state.spotShadowMap,ie),Fn.state.pointShadowMap.length>0&&Nt.setValue(V,"pointShadowMap",Fn.state.pointShadowMap,ie)),j.isSkinnedMesh){Nt.setOptional(V,j,"bindMatrix"),Nt.setOptional(V,j,"bindMatrixInverse");let Bt=j.skeleton;Bt&&(Bt.boneTexture===null&&Bt.computeBoneTexture(),Nt.setValue(V,"boneTexture",Bt.boneTexture,ie))}j.isBatchedMesh&&(Nt.setOptional(V,j,"batchingTexture"),Nt.setValue(V,"batchingTexture",j._matricesTexture,ie),Nt.setOptional(V,j,"batchingIdTexture"),Nt.setValue(V,"batchingIdTexture",j._indirectTexture,ie),Nt.setOptional(V,j,"batchingColorTexture"),j._colorsTexture!==null&&Nt.setValue(V,"batchingColorTexture",j._colorsTexture,ie));let Hs=ne.morphAttributes;if((Hs.position!==void 0||Hs.normal!==void 0||Hs.color!==void 0)&&H.update(j,ne,vi),(zs||Ne.receiveShadow!==j.receiveShadow)&&(Ne.receiveShadow=j.receiveShadow,Nt.setValue(V,"receiveShadow",j.receiveShadow)),(J.isMeshStandardMaterial||J.isMeshLambertMaterial||J.isMeshPhongMaterial)&&J.envMap===null&&B.environment!==null&&(tn.envMapIntensity.value=B.environmentIntensity),tn.dfgLUT!==void 0&&(tn.dfgLUT.value=d2()),zs){if(Nt.setValue(V,"toneMappingExposure",C.toneMappingExposure),Ne.needsLights&&S1(tn,eo),Le&&J.fog===!0&&Ye.refreshFogUniforms(tn,Le),Ye.refreshMaterialUniforms(tn,J,z,k,M.state.transmissionRenderTarget[R.id]),Ne.needsLights&&Ne.lightProbeGrid){let Bt=Ne.lightProbeGrid;tn.probesSH.value=Bt.texture,tn.probesMin.value.copy(Bt.boundingBox.min),tn.probesMax.value.copy(Bt.boundingBox.max),tn.probesResolution.value.copy(Bt.resolution)}No.upload(V,jr(Ne),tn,ie)}if(J.isShaderMaterial&&J.uniformsNeedUpdate===!0&&(No.upload(V,jr(Ne),tn,ie),J.uniformsNeedUpdate=!1),J.isSpriteMaterial&&Nt.setValue(V,"center",j.center),Nt.setValue(V,"modelViewMatrix",j.modelViewMatrix),Nt.setValue(V,"normalMatrix",j.normalMatrix),Nt.setValue(V,"modelMatrix",j.matrixWorld),J.uniformsGroups!==void 0){let Bt=J.uniformsGroups;for(let Gs=0,to=Bt.length;Gs<to;Gs++){let Gp=Bt[Gs];ae.update(Gp,vi),ae.bind(Gp,vi)}}return vi}function S1(R,B){R.ambientLightColor.needsUpdate=B,R.lightProbe.needsUpdate=B,R.sunLights.needsUpdate=B,R.sunLightShadows.needsUpdate=B,R.directionalLights.needsUpdate=B,R.directionalLightShadows.needsUpdate=B,R.pointLights.needsUpdate=B,R.pointLightShadows.needsUpdate=B,R.spotLights.needsUpdate=B,R.spotLightShadows.needsUpdate=B,R.rectAreaLights.needsUpdate=B,R.hemisphereLights.needsUpdate=B}function T1(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return W},this.getActiveMipmapLevel=function(){return O},this.getRenderTarget=function(){return te},this.setRenderTargetTextures=function(R,B,ne){let J=ee.get(R);J.__autoAllocateDepthBuffer=R.resolveDepthBuffer===!1,J.__autoAllocateDepthBuffer===!1&&(J.__useRenderToTexture=!1),ee.get(R.texture).__webglTexture=B,ee.get(R.depthTexture).__webglTexture=J.__autoAllocateDepthBuffer?void 0:ne,J.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(R,B){let ne=ee.get(R);ne.__webglFramebuffer=B,ne.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(R,B=0,ne=0){te=R,W=B,O=ne;let J=null,j=!1,Le=!1;if(R){let Ie=ee.get(R);if(Ie.__useDefaultFramebuffer!==void 0){T.bindFramebuffer(V.FRAMEBUFFER,Ie.__webglFramebuffer),$.copy(R.viewport),he.copy(R.scissor),Q=R.scissorTest,T.viewport($),T.scissor(he),T.setScissorTest(Q),X=-1;return}else if(Ie.__webglFramebuffer===void 0)ie.setupRenderTarget(R);else if(Ie.__hasExternalTextures)ie.rebindTextures(R,ee.get(R.texture).__webglTexture,ee.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){let ut=R.depthTexture;if(Ie.__boundDepthTexture!==ut){if(ut!==null&&ee.has(ut)&&(R.width!==ut.image.width||R.height!==ut.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ie.setupDepthRenderbuffer(R)}}let He=R.texture;(He.isData3DTexture||He.isDataArrayTexture||He.isCompressedArrayTexture)&&(Le=!0);let $e=ee.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray($e[B])?J=$e[B][ne]:J=$e[B],j=!0):R.samples>0&&ie.useMultisampledRTT(R)===!1?J=ee.get(R).__webglMultisampledFramebuffer:Array.isArray($e)?J=$e[ne]:J=$e,$.copy(R.viewport),he.copy(R.scissor),Q=R.scissorTest}else $.copy(ge).multiplyScalar(z).floor(),he.copy(Ue).multiplyScalar(z).floor(),Q=vt;if(ne!==0&&(J=N),T.bindFramebuffer(V.FRAMEBUFFER,J)&&T.drawBuffers(R,J),T.viewport($),T.scissor(he),T.setScissorTest(Q),j){let Ie=ee.get(R.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+B,Ie.__webglTexture,ne)}else if(Le){let Ie=B;for(let He=0;He<R.textures.length;He++){let $e=ee.get(R.textures[He]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+He,$e.__webglTexture,ne,Ie)}}else if(R!==null&&ne!==0){let Ie=ee.get(R.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,Ie.__webglTexture,ne)}X=-1};function Hp(R){let B=ee.get(R);return(B.__readFormat!==R.format||B.__readType!==R.type)&&(B.__readFormat=R.format,B.__readType=R.type,B.__formatReadable=L.textureFormatReadable(R.format),B.__typeReadable=L.textureTypeReadable(R.type)),B}this.readRenderTargetPixels=function(R,B,ne,J,j,Le,Fe,Ie=0){if(!(R&&R.isWebGLRenderTarget)){tt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let He=ee.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&Fe!==void 0&&(He=He[Fe]),He){T.bindFramebuffer(V.FRAMEBUFFER,He);try{let $e=R.textures[Ie],ut=$e.format,mt=$e.type;R.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+Ie);let Ge=Hp($e);if(Ge.__formatReadable===!1){tt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ge.__typeReadable===!1){tt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=R.width-J&&ne>=0&&ne<=R.height-j&&V.readPixels(B,ne,J,j,Te.convert(ut),Te.convert(mt),Le)}finally{let $e=te!==null?ee.get(te).__webglFramebuffer:null;T.bindFramebuffer(V.FRAMEBUFFER,$e)}}},this.readRenderTargetPixelsAsync=async function(R,B,ne,J,j,Le,Fe,Ie=0){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let He=ee.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&Fe!==void 0&&(He=He[Fe]),He)if(B>=0&&B<=R.width-J&&ne>=0&&ne<=R.height-j){T.bindFramebuffer(V.FRAMEBUFFER,He);let $e=R.textures[Ie],ut=$e.format,mt=$e.type;R.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+Ie);let Ge=Hp($e);if(Ge.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ge.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let It=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,It),V.bufferData(V.PIXEL_PACK_BUFFER,Le.byteLength,V.STREAM_READ),V.readPixels(B,ne,J,j,Te.convert(ut),Te.convert(mt),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);let an=te!==null?ee.get(te).__webglFramebuffer:null;T.bindFramebuffer(V.FRAMEBUFFER,an);let Gt=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await Jm(V,Gt,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,It),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,Le),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(It),V.deleteSync(Gt),Le}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(R,B=null,ne=0){let J=Math.pow(2,-ne),j=Math.floor(R.image.width*J),Le=Math.floor(R.image.height*J),Fe=B!==null?B.x:0,Ie=B!==null?B.y:0;ie.setTexture2D(R,0),V.copyTexSubImage2D(V.TEXTURE_2D,ne,0,0,Fe,Ie,j,Le),T.unbindTexture()},this.copyTextureToTexture=function(R,B,ne=null,J=null,j=0,Le=0){let Fe,Ie,He,$e,ut,mt,Ge,It,an,Gt=R.isCompressedTexture?R.mipmaps[Le]:R.image;if(ne!==null)Fe=ne.max.x-ne.min.x,Ie=ne.max.y-ne.min.y,He=ne.isBox3?ne.max.z-ne.min.z:1,$e=ne.min.x,ut=ne.min.y,mt=ne.isBox3?ne.min.z:0;else{let tn=Math.pow(2,-j);Fe=Math.floor(Gt.width*tn),Ie=Math.floor(Gt.height*tn),R.isDataArrayTexture?He=Gt.depth:R.isData3DTexture?He=Math.floor(Gt.depth*tn):He=1,$e=0,ut=0,mt=0}J!==null?(Ge=J.x,It=J.y,an=J.z):(Ge=0,It=0,an=0);let Ft=Te.convert(B.format),An=Te.convert(B.type),Ne;B.isData3DTexture?(ie.setTexture3D(B,0),Ne=V.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(ie.setTexture2DArray(B,0),Ne=V.TEXTURE_2D_ARRAY):(ie.setTexture2D(B,0),Ne=V.TEXTURE_2D),T.activeTexture(V.TEXTURE0),T.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,B.flipY),T.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),T.pixelStorei(V.UNPACK_ALIGNMENT,B.unpackAlignment);let Fn=T.getParameter(V.UNPACK_ROW_LENGTH),Mt=T.getParameter(V.UNPACK_IMAGE_HEIGHT),vi=T.getParameter(V.UNPACK_SKIP_PIXELS),Ki=T.getParameter(V.UNPACK_SKIP_ROWS),zs=T.getParameter(V.UNPACK_SKIP_IMAGES);T.pixelStorei(V.UNPACK_ROW_LENGTH,Gt.width),T.pixelStorei(V.UNPACK_IMAGE_HEIGHT,Gt.height),T.pixelStorei(V.UNPACK_SKIP_PIXELS,$e),T.pixelStorei(V.UNPACK_SKIP_ROWS,ut),T.pixelStorei(V.UNPACK_SKIP_IMAGES,mt);let eo=R.isDataArrayTexture||R.isData3DTexture,Nt=B.isDataArrayTexture||B.isData3DTexture;if(R.isDepthTexture){let tn=ee.get(R),Hs=ee.get(B),Bt=ee.get(tn.__renderTarget),Gs=ee.get(Hs.__renderTarget);T.bindFramebuffer(V.READ_FRAMEBUFFER,Bt.__webglFramebuffer),T.bindFramebuffer(V.DRAW_FRAMEBUFFER,Gs.__webglFramebuffer);for(let to=0;to<He;to++)eo&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,ee.get(R).__webglTexture,j,mt+to),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,ee.get(B).__webglTexture,Le,an+to)),V.blitFramebuffer($e,ut,Fe,Ie,Ge,It,Fe,Ie,V.DEPTH_BUFFER_BIT,V.NEAREST);T.bindFramebuffer(V.READ_FRAMEBUFFER,null),T.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(j!==0||R.isRenderTargetTexture||ee.has(R)){let tn=ee.get(R),Hs=ee.get(B);T.bindFramebuffer(V.READ_FRAMEBUFFER,I),T.bindFramebuffer(V.DRAW_FRAMEBUFFER,U);for(let Bt=0;Bt<He;Bt++)eo?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,tn.__webglTexture,j,mt+Bt):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,tn.__webglTexture,j),Nt?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Hs.__webglTexture,Le,an+Bt):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,Hs.__webglTexture,Le),j!==0?V.blitFramebuffer($e,ut,Fe,Ie,Ge,It,Fe,Ie,V.COLOR_BUFFER_BIT,V.NEAREST):Nt?V.copyTexSubImage3D(Ne,Le,Ge,It,an+Bt,$e,ut,Fe,Ie):V.copyTexSubImage2D(Ne,Le,Ge,It,$e,ut,Fe,Ie);T.bindFramebuffer(V.READ_FRAMEBUFFER,null),T.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else Nt?R.isDataTexture||R.isData3DTexture?V.texSubImage3D(Ne,Le,Ge,It,an,Fe,Ie,He,Ft,An,Gt.data):B.isCompressedArrayTexture?V.compressedTexSubImage3D(Ne,Le,Ge,It,an,Fe,Ie,He,Ft,Gt.data):V.texSubImage3D(Ne,Le,Ge,It,an,Fe,Ie,He,Ft,An,Gt):R.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,Le,Ge,It,Fe,Ie,Ft,An,Gt.data):R.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,Le,Ge,It,Gt.width,Gt.height,Ft,Gt.data):V.texSubImage2D(V.TEXTURE_2D,Le,Ge,It,Fe,Ie,Ft,An,Gt);T.pixelStorei(V.UNPACK_ROW_LENGTH,Fn),T.pixelStorei(V.UNPACK_IMAGE_HEIGHT,Mt),T.pixelStorei(V.UNPACK_SKIP_PIXELS,vi),T.pixelStorei(V.UNPACK_SKIP_ROWS,Ki),T.pixelStorei(V.UNPACK_SKIP_IMAGES,zs),Le===0&&B.generateMipmaps&&V.generateMipmap(Ne),T.unbindTexture()},this.initRenderTarget=function(R){ee.get(R).__webglFramebuffer===void 0&&ie.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?ie.setTextureCube(R,0):R.isData3DTexture?ie.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?ie.setTexture2DArray(R,0):ie.setTexture2D(R,0),T.unbindTexture()},this.resetState=function(){W=0,O=0,te=null,T.reset(),Ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ni}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=bt._getDrawingBufferColorSpace(e),t.unpackColorSpace=bt._getUnpackColorSpace()}};function kn(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function ve(n,e=0,t=0){let i=Math.imul(n|0,668265261)^Math.imul(e|0,374761393)^Math.imul(t|0,2654435761);return i=Math.imul(i^i>>>15,2246822507),i=Math.imul(i^i>>>13,3266489909),((i^i>>>16)>>>0)/4294967296}function os(){return Math.floor(Math.random()*2147483647)+1}var f2=72,p2=523.2511,I0=new WeakMap;function lr(n,e,t){let i=I0.get(n);i||(i={},I0.set(n,i));let s=i[e];return s===void 0&&(s=t(),i[e]=s),s}function Ka(n,e){let t=n.createBuffer(1,e.length,n.sampleRate);return t.getChannelData(0).set(e),t}function lf(n,e){let t=0;for(let i=0;i<n.length;i++)t=Math.max(t,Math.abs(n[i]));if(t>0){let i=e/t;for(let s=0;s<n.length;s++)n[s]*=i}return n}function Oo(n){return lr(n,"noise",()=>{let e=Math.floor(n.sampleRate*2.5),t=new Float32Array(e),i=kn(12648430);for(let s=0;s<e;s++)t[s]=i()*2-1;return Ka(n,t)})}function L0(n,e,t,i){let s=Math.floor(n*i),r=new Float32Array(s);for(let l of e){let c=p2*l.ratio;if(c*2.3>n/2)continue;let u=2*Math.PI*c/n,d=2*Math.cos(u),h=Math.exp(-1/(l.decay*n)),f=0,p=-Math.sin(u),x=l.amp,g=Math.min(s,Math.ceil(l.decay*n*9));for(let m=0;m<g;m++){let b=d*f-p;p=f,f=b,r[m]+=b*x,x*=h}}let o=Math.max(1,Math.floor(t*n));for(let l=0;l<o&&l<s;l++)r[l]*=.5-.5*Math.cos(Math.PI*l/o);let a=Math.floor(s*.25);for(let l=0;l<a;l++)r[s-1-l]*=.5-.5*Math.cos(Math.PI*l/a);return lf(r,.8)}function Iu(n,e){return e==="keys"?lr(n,"keys",()=>Ka(n,L0(n.sampleRate,[{ratio:1,amp:1,decay:1.25},{ratio:2,amp:.2,decay:.55},{ratio:3,amp:.05,decay:.3},{ratio:6.95,amp:.035,decay:.045}],.005,4.2))):lr(n,"marimba",()=>Ka(n,L0(n.sampleRate,[{ratio:1,amp:1,decay:.62},{ratio:3.98,amp:.2,decay:.12},{ratio:9.85,amp:.045,decay:.03},{ratio:.5,amp:.04,decay:.25}],.003,2.4)))}function Lu(n){return Math.pow(2,(n-f2)/12)}function ar(n,e,t,i,s,r,o=1.5){let a=Math.floor(t*e),l=Math.floor(i*e),c=0;for(let u=0;u<l&&a+u<n.length;u++){let d=u/l;c+=2*Math.PI*r(d)/e;let h=Math.pow(Math.sin(Math.PI*d),o);n[a+u]+=s*h*(Math.sin(c)+.1*Math.sin(2*c))}}var Za=(n,e)=>t=>n*Math.pow(e/n,t);function D0(n){return lr(n,"birds",()=>{let e=n.sampleRate,t=[],i=(s,r)=>{let o=new Float32Array(Math.floor(e*s));r(o),t.push(lf(o,.7))};return i(.5,s=>{for(let r=0;r<3;r++)ar(s,e,r*.15,.075,1-r*.15,Za(3100,4300))}),i(.5,s=>{for(let r=0;r<9;r++){let o=5e3-r*60;ar(s,e,r*.045,.03,.6+.4*Math.sin(r/8*Math.PI),Za(o,o*.74),1.2)}}),i(.55,s=>{ar(s,e,0,.17,1,Za(3650,3500),1.1),ar(s,e,.23,.25,.85,r=>2950+55*Math.sin(2*Math.PI*9*r*.25),1.1)}),i(.42,s=>{ar(s,e,.01,.36,1,r=>3150+430*Math.sin(2*Math.PI*23*r*.36),1)}),i(.3,s=>{ar(s,e,0,.04,1,Za(4900,3600),1),ar(s,e,.13,.04,.8,Za(4800,3550),1)}),t.map(s=>Ka(n,s))})}function cf(n){return lr(n,"crickets",()=>{let e=n.sampleRate,t=(i,s,r,o)=>{let a=new Float32Array(Math.floor(e*(i.length*r+.03)));return i.forEach((l,c)=>{let u=s*(1-.012*c);ar(a,e,.004+c*r,o,l,()=>u,2)}),Ka(n,lf(a,.6))};return[t([.6,1,.92,.75],4650,.023,.014),t([.7,1,.8],4250,.026,.016)]})}function k0(n){return lr(n,"reverb",()=>{let e=n.sampleRate,t=1.6,i=1.5,s=Math.floor(e*t),r=n.createBuffer(2,s,e),o=Math.floor(.014*e),a=Math.floor(.01*e);for(let l=0;l<2;l++){let c=r.getChannelData(l),u=kn(24301+l*977),d=0,h=1,f=Math.exp(-6.9/(i*e)),p=0;for(let g=o;g<s;g++){let m=g-o;if((m&63)===0){let b=7500*Math.pow(.16,Math.min(1,m/e/t));p=Math.exp(-2*Math.PI*b/e)}d=(1-p)*(u()*2-1)+p*d,c[g]=d*h*(m<a?m/a:1),h*=f}let x=Math.floor(.1*e);for(let g=0;g<x;g++)c[s-1-g]*=g/x}return r})}function N0(n,e){let t=new Float32Array([0,...e]),i=new Float32Array(t.length);return n.createPeriodicWave(i,t)}function Du(n){return lr(n,"padWave",()=>N0(n,[1,.42,.22,.12,.065,.035,.018,.009]))}function ku(n){return lr(n,"bassWave",()=>N0(n,[1,.38,.1]))}function fn(n){return 440*Math.pow(2,(n-69)/12)}function as(n,e,t){return n<e?e:n>t?t:n}function U0(n,e,t){return n+(e-n)*t}function Qe(n,e,t){return e+(t-e)*n()}function ti(n,e){return e[Math.min(e.length-1,Math.floor(n()*e.length))]}function Nu(n,e){let t=0;for(let s of e)t+=s;let i=n()*t;for(let s=0;s<e.length;s++)if(i-=e[s],i<0)return s;return e.length-1}function uf(n,e,t,i,s){let r=Math.max(5e-4,i);return n.setValueAtTime(0,e),n.linearRampToValueAtTime(t,e+r),n.exponentialRampToValueAtTime(Math.max(t*5e-4,1e-6),e+r+s),n.linearRampToValueAtTime(0,e+r+s+.005),e+r+s+.006}function Ja(n,e,t,i,s,r){let o=Math.max(e+.001,Math.min(s,e+i));n.setValueAtTime(0,e),n.linearRampToValueAtTime(t,o);let a=Math.max(o,s);return n.setValueAtTime(t,a),n.setTargetAtTime(0,a,r/6),n.setValueAtTime(0,a+r*1.4),a+r*1.4+.01}function ja(n,e,t,i,s){n.setValueAtTime(t,e),n.exponentialRampToValueAtTime(i,e+Math.max(.001,s))}function ot(n,e=0){let t=n.createGain();return t.gain.value=e,t}function cr(n,e,t){let i=n.createOscillator();return typeof e=="string"?i.type=e:i.setPeriodicWave(e),i.frequency.value=t,i}function bn(n,e,t,i=.7071){let s=n.createBiquadFilter();return s.type=e,s.frequency.value=t,s.Q.value=i,s}function Fo(...n){for(let e of n)try{e.automationRate="k-rate"}catch{}}function ur(n,e){if(typeof n.createStereoPanner=="function"){let t=n.createStereoPanner();return t.pan.value=as(e,-1,1),t}return ot(n,1)}function Bo(n,e,t){n.start(e),n.stop(t)}function m2(n){return 1-Math.exp(-Math.max(0,n)/4e3)}var O0=1.2,Uu=class{constructor(e,t,i,s){this.ctx=e;this.crickets=[];this.day=1;this.night=0;this.pop=0;this.paused=!1;this.nextBird=0;this.nextTraffic=0;this.gusts=[];this.applied={breeze:-1,city:-1,out:-1};this.rng=kn(s),this.wet=i;let r=e.currentTime;this.out=ot(e,1),this.out.connect(t);let o=e.createBufferSource();o.buffer=Oo(e),o.loop=!0,o.start(r);let a=(b,w,y,_,M)=>{Fo(b),b.setValueAtTime((w+y)/2,r),this.gusts.push({param:b,lo:w,hi:y,minDur:_,maxDur:M,next:r})};this.breeze=ot(e,0);let l=bn(e,"bandpass",480,.9);a(l.frequency,300,720,3,8);let c=bn(e,"lowpass",1400,.5),u=ot(e,.6);a(u.gain,.3,1,1.5,5);let d=ur(e,0);d.pan&&a(d.pan,-.5,.5,6,14),o.connect(l).connect(c).connect(u).connect(d).connect(this.breeze);let h=bn(e,"bandpass",2300,.7),f=ot(e,.12);a(f.gain,.03,.22,1,4),o.connect(h).connect(f).connect(this.breeze),this.breeze.connect(this.out),this.city=ot(e,0);let p=bn(e,"lowpass",170,.7),x=bn(e,"lowpass",260,.7);o.connect(p).connect(x).connect(this.city);let g=bn(e,"bandpass",650,.5);o.connect(g).connect(ot(e,.09)).connect(this.city),this.city.connect(this.out);let m=cf(e).length;for(let[b,w,y,_]of[[-.65,1,.52,1],[.55,.93,.61,.8],[.1,1.06,.46,.55]]){let M=ur(e,b);M.connect(this.out),this.crickets.push({pan:M,rate:w,interval:y,level:_,next:r+Qe(this.rng,.2,1.5),train:0,buffer:this.crickets.length%m})}this.nextBird=r+Qe(this.rng,.8,2.5),this.nextTraffic=r+Qe(this.rng,1,4)}set(e,t){this.night=as(Number.isFinite(e.night)?e.night:0,0,1),this.day=1-this.night,this.pop=m2(Number.isFinite(e.population)?e.population:0),this.paused=!!e.paused;let i=.15*(.4+.6*this.day)*(1-.45*this.pop),s=.2*Math.pow(this.pop,.8)*(1-.35*this.night),r=this.paused?.35:1;this.move(this.breeze.gain,"breeze",i,t,O0),this.move(this.city.gain,"city",s,t,O0*2),this.move(this.out.gain,"out",r,t,.4)}move(e,t,i,s,r){Math.abs(this.applied[t]-i)<.002||(this.applied[t]=i,e.setTargetAtTime(i,s,r))}scheduleUntil(e,t){let i=this.rng,s=this.paused?2:1;for(let a of this.gusts)for(a.next<e&&(a.param.cancelScheduledValues(e),a.param.setValueAtTime(a.param.value,e),a.next=e);a.next<t;)a.next+=Qe(i,a.minDur,a.maxDur),a.param.linearRampToValueAtTime(Qe(i,a.lo,a.hi),a.next);let r=this.day*(1-.55*this.pop);for(this.nextBird<e&&(this.nextBird=e+Qe(i,.2,1.5));this.nextBird<t;)if(r>.08){let a=Qe(i,-.8,.8);this.bird(this.nextBird,a,r),i()<.35&&this.bird(this.nextBird+Qe(i,.45,1),-a*Qe(i,.5,1),r*.8),this.nextBird+=Qe(i,2.5,7.5)*s/Math.max(.35,r)}else this.nextBird+=2;let o=this.night*(1-.6*this.pop);for(let a of this.crickets)for(a.next<e&&(a.next=e+Qe(i,0,.3));a.next<t;)if(o>.04){if(a.train<=0){a.train=6+Math.floor(i()*10),a.next+=Qe(i,.8,3.5)*s;continue}this.chirp(a,a.next,o),a.train--,a.next+=a.interval*Qe(i,.96,1.04)}else a.next+=1;for(this.nextTraffic<e&&(this.nextTraffic=e+Qe(i,.5,2));this.nextTraffic<t;)this.pop>.03?(this.swell(this.nextTraffic),this.nextTraffic+=Qe(i,.6,1.4)*U0(16,2.8,this.pop)*s):this.nextTraffic+=2}bird(e,t,i){let s=this.ctx,r=s.createBufferSource();r.buffer=ti(this.rng,D0(s)),r.playbackRate.value=Qe(this.rng,.88,1.12);let o=ot(s,Qe(this.rng,.05,.11)*Math.min(1,i*1.3)),a=ur(s,t);r.connect(o).connect(a).connect(this.out),this.wet&&o.connect(this.wet),r.start(e),r.onended=()=>{o.disconnect(),a.disconnect()}}chirp(e,t,i){let s=this.ctx,r=s.createBufferSource();r.buffer=cf(s)[e.buffer],r.playbackRate.value=e.rate*Qe(this.rng,.99,1.01);let o=ot(s,.075*e.level*i*Qe(this.rng,.85,1));r.connect(o).connect(e.pan),r.start(t),r.onended=()=>o.disconnect()}swell(e){let t=this.ctx,i=this.rng,s=Qe(i,3,6),r=e+s*Qe(i,.4,.6),o=e+s,a=t.createBufferSource();a.buffer=Oo(t),a.loop=!0;let l=Qe(i,300,420),c=t.createGain(),u=(x,g,m)=>{let b=bn(t,"bandpass",x,g);Fo(b.frequency),b.frequency.setValueAtTime(x,e),b.frequency.linearRampToValueAtTime(x*1.35,r),b.frequency.linearRampToValueAtTime(x*.88,o),a.connect(b).connect(ot(t,m)).connect(c)};u(l,1.4,1),u(l*3.3,1.8,.4);let d=.1*(.45+.55*this.pop)*(1-.45*this.night)*Qe(i,.6,1),h=ot(t);h.gain.setValueAtTime(0,e),h.gain.linearRampToValueAtTime(d*.35,e+(r-e)*.6),h.gain.linearRampToValueAtTime(d,r),h.gain.linearRampToValueAtTime(d*.3,r+(o-r)*.5),h.gain.linearRampToValueAtTime(0,o);let f=i()<.5?-1:1,p=ur(t,-.7*f);p.pan&&(Fo(p.pan),p.pan.setValueAtTime(-.7*f,e),p.pan.linearRampToValueAtTime(.7*f,o)),c.connect(h).connect(p).connect(this.out),a.start(e,i()*2),a.stop(o+.05),a.onended=()=>{a.disconnect(),c.disconnect(),h.disconnect(),p.disconnect()}}};var g2=.9,F0=1.05,B0=1.9,x2=.08,b2=.55,y2=.8;function z0(n){let e=Number.isFinite(n)?Math.min(1,Math.max(0,n)):0;return e*e}function H0(n){let e=ot(n,y2);e.connect(n.destination);let t=n.createDynamicsCompressor();t.threshold.value=-12,t.knee.value=10,t.ratio.value=3,t.attack.value=.004,t.release.value=.25,t.connect(e);let i=ot(n,1);i.connect(t);let s=n.createConvolver(),r=ot(n,1),o=ot(n,b2),a=bn(n,"highpass",240,.6);r.connect(a).connect(s).connect(o).connect(i);let l=ot(n,0);l.connect(i),l.connect(ot(n,x2)).connect(r);let c=ot(n,0);c.connect(i);let u=ot(n,0);u.connect(r);let d=ot(n,1);d.connect(i);let h=ot(n,0);h.connect(d);let f=ot(n,0);return f.connect(r),{master:i,sfx:l,ambience:c,ambienceWet:u,music:h,musicWet:f,duck:d,reverb:s,compressor:t}}function G0(n,e){e.reverb.buffer||(e.reverb.buffer=k0(n))}function hf(n,e,t,i=-1){let s=z0(e),r=z0(t),o=(a,l)=>{i<0?a.value=l:a.setTargetAtTime(l,i,.05)};o(n.sfx.gain,g2*s),o(n.ambience.gain,F0*s),o(n.ambienceWet.gain,F0*s),o(n.music.gain,B0*r),o(n.musicWet.gain,B0*r)}var V0=[0,2,4,5,7,9,11],v2=[0,2,4,7,9],df=[0,2,3,5,7,10],Ou=[[0,5,3,4],[0,3,5,4],[5,3,0,4],[0,4,5,3],[3,0,4,5],[0,2,3,4],[0,3,0,4],[1,4,0,5],[0,5,1,4],[3,4,2,5]],_2=[[[0,2],[2,2],[4,4]],[[0,3],[3,1],[4,2],[6,2]],[[0,4],[4,2],[6,2]],[[0,6],[6,2]],[[2,2],[4,2],[6,2]],[[0,8]],[[0,1],[1,1],[2,2],[4,4]],[[0,2],[3,3],[6,2]]],M2=[[3,3,2,1,2,0,2,2],[2,1,3,3,1,1,0,2],[3,3,1,1,2,0,2,2],[0,0,1,3,0,4,0,0]],ff=.42,W0=.17,w2=.016,S2=.048,Fu=class{constructor(e,t,i,s){this.ctx=e;this.trace=null;this.next=0;this.bpm=76;this.key=0;this.voice="marimba";this.barInSection=0;this.sectionsLeft=0;this.breathing=!1;this.lastTexture=null;this.lastProg=-1;this.padPrev=null;this.melScale=[];this.melIdx=0;this.arpStyle=0;this.padCutoff=1e3;this.padRampEnd=0;this.rng=kn(s);let r=(o,a)=>{o.connect(t),i&&a>0&&o.connect(ot(e,a)).connect(i)};this.melBus=ot(e,1),r(this.melBus.connect(ur(e,.18)),.42),this.arpBus=ot(e,1),r(this.arpBus.connect(ur(e,-.22)),.38),this.padBus=ot(e,1),this.padFilter=bn(e,"lowpass",1e3,.5),r(this.padBus.connect(this.padFilter),.6),Fo(this.padFilter.frequency),this.bassBus=ot(e,1),r(this.bassBus.connect(bn(e,"lowpass",420,.6)),.05),this.newPiece(!0),this.section=this.makeSection(ti(this.rng,["calm","arp"]))}setLayerLevels(e){let t={melody:this.melBus,arp:this.arpBus,pad:this.padBus,bass:this.bassBus};for(let[i,s]of Object.entries(e))typeof s=="number"&&Number.isFinite(s)&&(t[i].gain.value=Math.max(0,s))}get nextTime(){return this.next}restart(e){this.next=e,this.padPrev=null,this.breathing=!1,this.section=this.makeSection("calm"),this.barInSection=0}scheduleUntil(e){for(let t=0;t<8&&this.next<e;t++){let i=240/this.bpm;this.bar(this.next,i),this.next+=i,this.barInSection++,this.barInSection>=this.section.bars&&this.nextSection()}}newPiece(e){let t=this.rng;if(e)this.key=ti(t,df);else{let i=df.filter(s=>s===(this.key+5)%12||s===(this.key+7)%12||s===this.key);this.key=i.length>1?ti(t,i.filter(s=>s!==this.key)):ti(t,df)}this.bpm=Math.round(Qe(t,72,84)),this.voice=e||t()<.55?"marimba":"keys",this.sectionsLeft=4+Math.floor(t()*3),this.arpStyle=Math.floor(t()*3),this.melScale=[];for(let i=67;i<=88;i++)v2.includes(((i-this.key)%12+12)%12)&&this.melScale.push(i);this.melIdx=Math.floor(this.melScale.length/2),this.padCutoff=Qe(t,850,1250)}makeSection(e){let t=this.rng,i=Math.floor(t()*Ou.length);i===this.lastProg&&(i=(i+1+Math.floor(t()*(Ou.length-1)))%Ou.length),this.lastProg=i;let s=e==="calm"||t()<.4?2:1;return this.lastTexture=e,{prog:Ou[i],barsPerChord:s,bars:8,texture:e,add9:t()<.5}}nextSection(){if(this.barInSection=0,this.breathing){this.breathing=!1,this.newPiece(!1),this.section=this.makeSection(ti(this.rng,["calm","arp"]));return}if(this.sectionsLeft--,this.sectionsLeft<=0){this.breathing=!0,this.section={prog:[0],barsPerChord:2,bars:2,texture:"breath",add9:!0};return}let e=["calm","arp","melody","duet"],t=e.map(i=>i===this.lastTexture?0:i==="melody"?3:i==="duet"?1.5:i==="arp"?2:1);this.section=this.makeSection(e[Nu(this.rng,t)])}chordPcs(e){let t=s=>V0[s%7]+12*Math.floor(s/7),i=[t(e),t(e+2),t(e+4)];return e===4||(e===0||e===3)&&this.section.add9?i.push(t(e+8)):i.push(t(e+6)),i.map(s=>(s+this.key)%12)}voicing(e){let s=[...e].sort((c,u)=>c-u),r=[];for(let c=0;c<s.length;c++){let u=[...s.slice(c),...s.slice(0,c)],d=52+((u[0]-52)%12+12)%12;for(let h=-12;h<=12;h+=12){let f=[],p=d+h-1;for(let x of u){let g=p+1+((x-(p+1))%12+12)%12;f.push(g),p=g}f[0]>=52&&f[f.length-1]<=76&&r.push(f)}}if(r.length===0)return s.map(c=>60+c);let o=this.padPrev,a=r[0],l=1/0;for(let c of r){let u=o?c.reduce((d,h,f)=>d+Math.abs(h-o[f]),0):Math.abs((c[0]+c[c.length-1])/2-62);u<l&&(l=u,a=c)}return this.padPrev=a,a}bar(e,t){let i=this.section,s=Math.floor(this.barInSection/i.barsPerChord)%i.prog.length,r=i.prog[s],o=this.chordPcs(r),a=this.barInSection%i.barsPerChord,l=i.barsPerChord*t,c=t/8;if(a===0){let u=this.voicing(o);this.pad(e,l,u,i.texture==="breath"?.75:1);let d=this.bassNote(r);i.texture==="breath"||(i.barsPerChord===2&&this.rng()<.5?(this.bass(e,t,d,1),this.bass(e+t,t,d+7,.6)):this.bass(e,l,d,1))}switch(i.texture){case"calm":this.calmBar(e,c,o);break;case"arp":this.arpBar(e,c,o,.3,60,84);break;case"melody":this.melodyBar(e,c,o),this.rng()<.35&&this.calmBar(e,c,o,.5);break;case"duet":this.melodyBar(e,c,o),this.arpBar(e,c,o,.5,60,76);break;case"breath":a===0&&this.note(this.arpBus,e+c*2,this.nearestChordTone(76,o),.5,W0*1.2);break}}bassNote(e){return 40+(((V0[e]+this.key)%12-40)%12+12)%12}nearestChordTone(e,t){for(let i=0;i<12;i++){if(t.includes(((e-i)%12+12)%12))return e-i;if(t.includes(((e+i)%12+12)%12))return e+i}return e}calmBar(e,t,i,s=1){let r=this.rng,o=[];for(let a=70;a<=86;a++)i.includes(a%12)&&o.push(a);r()<.65*s&&this.note(this.melBus,e+this.humanize(),ti(r,o),Qe(r,.4,.6),ff*.8),r()<.45*s&&this.note(this.melBus,e+t*ti(r,[4,5,6])+this.humanize(),ti(r,o),Qe(r,.3,.5),ff*.8)}arpBar(e,t,i,s,r,o){let a=this.rng,l=[];for(let f=r;f<=o;f++)i.includes(f%12)&&l.push(f);if(l.length===0)return;let c=Math.min(l.length,6),u=Math.max(0,Math.floor((l.length-c)/2)),d=l.slice(u,u+c),h;this.arpStyle===0?h=d:this.arpStyle===1?h=[...d,...d.slice(1,-1).reverse()]:h=d.flatMap((f,p)=>p%2===0?[f]:[]).concat(d.filter((f,p)=>p%2===1));for(let f=0;f<8;f++){if(f>0&&a()<s)continue;let p=f===0?.9:f===4?.75:Qe(a,.5,.65);this.note(this.arpBus,e+f*t+this.humanize(),h[f%h.length],p,W0)}}melodyBar(e,t,i){let s=this.rng,r=this.barInSection%4,o=_2[Nu(s,M2[r])];if(r===3&&s()<.35)return;let a=this.melScale,l=Math.floor(a.length/2);o.forEach(([c],u)=>{let d=[-3,-2,-1,0,1,2,3],h=(this.melIdx-l)/a.length,f=[.04,.14,.3,.08,.3,.14,.04].map((m,b)=>m*Math.max(.05,1-h*d[b]*.9));this.melIdx=as(this.melIdx+d[Nu(s,f)],0,a.length-1);let p=c===0||c===4,x=u===o.length-1&&r===3;if(p||x){let m=this.melIdx;for(let b=0;b<a.length;b++){let w=this.melIdx-b,y=this.melIdx+b;if(w>=0&&i.includes(a[w]%12)){m=w;break}if(y<a.length&&i.includes(a[y]%12)){m=y;break}}this.melIdx=m}let g=(p?.8:.62)+Qe(s,-.08,.08);this.note(this.melBus,e+c*t+this.humanize(),a[this.melIdx],g,ff)})}humanize(){return Qe(this.rng,0,.012)}note(e,t,i,s,r){let o=this.ctx;this.trace?.({t,dur:.5,midi:i,vel:s,voice:e===this.melBus?"melody":"arp",texture:this.section.texture});let a=o.createBufferSource();a.buffer=Iu(o,this.voice);let l=Lu(i);a.playbackRate.value=l;let c=ot(o,r*Math.pow(as(s,0,1),1.5));a.connect(c).connect(e),a.start(t),a.onended=()=>c.disconnect()}pad(e,t,i,s){let r=this.ctx,o=Du(r),a=Math.min(1.4,t*.4),l=1.8,c=this.padFilter.frequency;e>this.padRampEnd+.01&&c.setValueAtTime(c.value,e),this.padRampEnd=e+t,c.linearRampToValueAtTime(this.padCutoff*Qe(this.rng,.8,1.25),this.padRampEnd);for(let u of i){this.trace?.({t:e,dur:t,midi:u,vel:s,voice:"pad",texture:this.section.texture});let d=ot(r),h=Ja(d.gain,e,w2*s*(u>70?.75:1),a,e+t,l);d.connect(this.padBus);for(let f of[-6,6]){let p=cr(r,o,fn(u));p.detune.value=f+Qe(this.rng,-2,2),p.connect(d),p.start(e),p.stop(h),f>0&&(p.onended=()=>d.disconnect())}}}bass(e,t,i,s){let r=this.ctx;this.trace?.({t:e,dur:t,midi:i,vel:s,voice:"bass",texture:this.section.texture});let o=cr(r,ku(r),fn(i)),a=ot(r),l=S2*s;a.gain.setValueAtTime(0,e),a.gain.linearRampToValueAtTime(l,e+.05),a.gain.setTargetAtTime(l*.45,e+.05,.9),a.gain.setTargetAtTime(0,e+t-.1,.18),o.connect(a).connect(this.bassBus),o.start(e),o.stop(e+t+1),o.onended=()=>a.disconnect()}};function Jt(n,e,t,i){let s=cr(n,i.type??"sine",i.f);i.f2!==void 0&&ja(s.frequency,t,i.f,i.f2,i.glideTime??i.decay);let r=ot(n),o=uf(r.gain,t,i.peak,i.attack,i.decay);return s.connect(r).connect(e),Bo(s,t,o),o}function zi(n,e,t,i,s){let r=n.createBufferSource();r.buffer=Oo(n),r.loop=!0;let o=bn(n,s.filter,s.f,s.q??.7071);s.f2!==void 0&&ja(o.frequency,t,s.f,s.f2,s.sweep??s.decay);let a=ot(n),l=uf(a.gain,t,s.peak,s.attack,s.decay);return r.connect(o).connect(a).connect(e),r.start(t,i()*2),r.stop(l),l}function Bu(n,e,t,i,s,r,o=[[1,1,1],[2,.22,.45],[3,.07,.25]]){for(let[a,l,c]of o)Jt(n,e,t,{f:i*a,peak:s*l,attack:.003,decay:r*c})}function X0(n,e,t,i,s,r){let o=[1,2.41,3.77,5.33],a=[1,.62,.4,.24],l=[.2,.13,.085,.055];for(let c=0;c<o.length;c++)Jt(n,e,t,{f:s*o[c],peak:r*a[c],attack:.001,decay:l[c]});zi(n,e,t,i,{filter:"highpass",f:3500,peak:r*.6,attack:5e-4,decay:.012})}function pf(n,e,t,i,s,r){let o=n.createBufferSource();o.buffer=Iu(n,"marimba"),o.playbackRate.value=Lu(i);let a=ot(n,s);a.gain.setValueAtTime(s,Math.max(t,r-.25)),a.gain.linearRampToValueAtTime(0,r),o.connect(a).connect(e),Bo(o,t,r)}var mf=[96,98,100,103,105,108],Dr={click:{length:.08,variants:3,gapMs:35,cents:60,recipe(n,e,t,i){let s=Qe(i,1700,1900);Jt(n,e,t,{f:s,f2:s*.72,glideTime:.03,peak:.3,attack:8e-4,decay:.04}),Jt(n,e,t,{f:s*2.71,peak:.06,attack:5e-4,decay:.01}),zi(n,e,t,i,{filter:"highpass",f:4200,peak:.05,attack:4e-4,decay:.006})}},tool:{length:.2,variants:2,gapMs:60,cents:35,recipe(n,e,t,i){let s=fn(74)*Qe(i,.99,1.01);Jt(n,e,t,{f:s,f2:s*1.5,glideTime:.05,peak:.3,attack:.004,decay:.13}),Jt(n,e,t,{f:s*2,f2:s*3,glideTime:.05,peak:.05,attack:.003,decay:.06}),zi(n,e,t,i,{filter:"bandpass",f:2400,q:1.2,peak:.04,attack:5e-4,decay:.01})}},road:{length:.3,variants:3,gapMs:70,cents:70,recipe(n,e,t,i){let s=Qe(i,150,170);Jt(n,e,t,{f:s,f2:s*.37,glideTime:.13,peak:.55,attack:.002,decay:.2}),Jt(n,e,t,{f:s*2,f2:s*.74,glideTime:.11,peak:.2,attack:.002,decay:.12}),zi(n,e,t,i,{filter:"lowpass",f:Qe(i,900,1300),q:.8,peak:.38,attack:.001,decay:.07}),zi(n,e,t+.004,i,{filter:"bandpass",f:Qe(i,2200,3e3),q:1.3,peak:.07,attack:.001,decay:.025})}},zone:{length:.85,variants:3,gapMs:80,cents:12,recipe(n,e,t,i){let s=ti(i,[84,86,88]);Bu(n,e,t,fn(s),.2,.42),Bu(n,e,t+.055,fn(s+7),.15,.5)}},build:{length:.7,variants:3,gapMs:100,cents:45,recipe(n,e,t,i){let s=Qe(i,120,135);Jt(n,e,t,{f:s,f2:s*.38,glideTime:.18,peak:.6,attack:.002,decay:.3}),Jt(n,e,t,{f:s*2,f2:s*.76,glideTime:.15,peak:.2,attack:.002,decay:.14}),zi(n,e,t,i,{filter:"lowpass",f:700,q:.9,peak:.35,attack:.001,decay:.1});let r=Qe(i,560,650);X0(n,e,t+.075,i,r,.12),X0(n,e,t+.2,i,r*1.13,.06)}},bulldoze:{length:.6,variants:3,gapMs:90,cents:80,recipe(n,e,t,i){zi(n,e,t,i,{filter:"lowpass",f:240,q:.9,peak:.55,attack:.008,decay:.38}),Jt(n,e,t,{f:95,f2:42,glideTime:.15,peak:.35,attack:.002,decay:.2});let s=8+Math.floor(i()*3),r=Array.from({length:s},(o,a)=>a===0?0:i()*.3).sort((o,a)=>o-a);for(let o of r)zi(n,e,t+o,i,{filter:"bandpass",f:Qe(i,600,2800),q:Qe(i,.8,2),peak:Qe(i,.14,.3)*(1-o*1.6),attack:.001,decay:Qe(i,.015,.05)})}},denied:{length:.42,variants:1,gapMs:250,cents:15,recipe(n,e,t){let i=bn(n,"lowpass",900,.6);i.connect(e);for(let[s,r,o,a,l]of[[0,63,62,.22,.11],[.12,58,57,.26,.22]])Jt(n,i,t+s,{type:"triangle",f:fn(r),f2:fn(o),glideTime:l,peak:a,attack:.012,decay:l}),Jt(n,i,t+s,{f:fn(r-12),peak:a*.4,attack:.012,decay:l})}},cash:{length:.75,variants:2,gapMs:120,cents:12,recipe(n,e,t,i){zi(n,e,t,i,{filter:"highpass",f:5e3,peak:.08,attack:5e-4,decay:.012});let s=[[1,1,1],[2,.3,.4],[4.2,.08,.15]];Bu(n,e,t+.004,fn(91),.2,.42,s),Bu(n,e,t+.04,fn(95),.17,.55,s),Jt(n,e,t+.07,{f:fn(107),peak:.025,attack:.002,decay:.14})}},milestone:{length:2.2,variants:1,gapMs:1500,cents:0,recipe(n,e,t,i){let s=ot(n,.7);s.connect(e);let r=[72,76,79,84,88],o=t+2.15;r.forEach((x,g)=>pf(n,s,t+g*.085,x,.3+g*.025,o)),r.forEach((x,g)=>Jt(n,s,t+g*.085,{f:fn(x+12),peak:.025,attack:.002,decay:.12}));let a=t+.43,l=a+.85,c=bn(n,"lowpass",700,.9);c.frequency.setValueAtTime(700,a),c.frequency.linearRampToValueAtTime(3200,a+.08),c.frequency.exponentialRampToValueAtTime(1300,a+.9);let u=ot(n),d=Ja(u.gain,a,1,.05,l,.55);c.connect(u).connect(s);let h=Du(n);for(let x of[60,67,72,74,76])for(let g of[-7,7]){let m=cr(n,h,fn(x));m.detune.value=g;let b=ot(n,.026);m.connect(b).connect(c),Bo(m,a,d)}let f=cr(n,ku(n),fn(48)),p=ot(n);Ja(p.gain,a,.14,.03,l,.5),f.connect(p).connect(s),Bo(f,a,d),pf(n,s,a,84,.26,o),pf(n,s,a,72,.2,o);for(let x=0;x<7;x++){let g=.47+x*.12+i()*.05;Jt(n,s,t+g,{f:fn(ti(i,mf)),peak:.05*(1-x/9),attack:.002,decay:.12})}}},grow:{length:.3,variants:4,gapMs:333,cents:30,recipe(n,e,t,i){let s=2+Math.floor(i()*2),r=Math.floor(i()*3);for(let o=0;o<s;o++){let a=mf[Math.min(mf.length-1,r)];r+=1+Math.floor(i()*2),Jt(n,e,t+o*.055,{f:fn(a),peak:.11-o*.025,attack:.002,decay:.07}),Jt(n,e,t+o*.055,{f:fn(a)*2,peak:.015,attack:.002,decay:.03})}}},undo:{length:.36,variants:1,gapMs:120,cents:30,recipe(n,e,t,i){let r=c=>{let u=ot(n);return u.gain.setValueAtTime(1e-4,t),u.gain.exponentialRampToValueAtTime(c,t+.28),u.gain.linearRampToValueAtTime(0,t+.28+.035),u},o=n.createBufferSource();o.buffer=Oo(n),o.loop=!0;let a=bn(n,"bandpass",3e3,1.6);ja(a.frequency,t,3200,650,.28),o.connect(a).connect(r(.5)).connect(e),o.start(t,i()*2),o.stop(t+.28+.04);let l=cr(n,"sine",1200);ja(l.frequency,t,1200,520,.28),l.connect(r(.09)).connect(e),Bo(l,t,t+.28+.04)}},open:{length:.13,variants:2,gapMs:80,cents:40,recipe(n,e,t,i){let s=Qe(i,400,440);Jt(n,e,t,{f:s,f2:s*2.3,glideTime:.05,peak:.28,attack:.002,decay:.07}),Jt(n,e,t,{f:s*2,f2:s*4.6,glideTime:.05,peak:.035,attack:.002,decay:.04})}},close:{length:.13,variants:2,gapMs:80,cents:40,recipe(n,e,t,i){let s=Qe(i,880,940);Jt(n,e,t,{f:s,f2:s*.44,glideTime:.06,peak:.26,attack:.002,decay:.075})}},month:{length:.12,variants:2,gapMs:400,cents:50,recipe(n,e,t,i){zi(n,e,t,i,{filter:"bandpass",f:Qe(i,3400,4200),q:.9,peak:.14,attack:8e-4,decay:.018}),zi(n,e,t+.01,i,{filter:"highpass",f:5500,peak:.04,attack:.02,decay:.05}),Jt(n,e,t,{f:Qe(i,1250,1400),peak:.035,attack:.001,decay:.03})}}},T2=Object.keys(Dr);function E2(n,e){let t=0;for(let i=0;i<n.length;i++)t=t*31+n.charCodeAt(i)|0;return Math.floor(ve(t,e,7)*2147483647)+1}function A2(){let n=globalThis;return n.OfflineAudioContext??n.webkitOfflineAudioContext??null}function R2(n){return new Promise((e,t)=>{n.oncomplete=i=>e(i.renderedBuffer);try{let i=n.startRendering();i&&typeof i.then=="function"&&i.then(e,t)}catch(i){t(i)}})}async function Y0(n,e=T2){let t=A2();if(!t)throw new Error("OfflineAudioContext is not available");let i=.02,s=[],r=i;for(let u of e)for(let d=0;d<Dr[u].variants;d++)s.push({id:u,variant:d,start:r}),r+=Dr[u].length+i;let o=new t(1,Math.ceil(r*n),n);for(let u of s)Dr[u.id].recipe(o,o.destination,u.start,kn(E2(u.id,u.variant)));let l=(await R2(o)).getChannelData(0),c=new Map;for(let u of s){let d=Math.round(u.start*n),h=Math.min(Math.round(Dr[u.id].length*n),l.length-d);for(;h>1&&Math.abs(l[d+h-1])<1e-4;)h--;let f=o.createBuffer(1,Math.max(1,h),n);f.getChannelData(0).set(l.subarray(d,d+h));let p=c.get(u.id)??[];p.push(f),c.set(u.id,p)}return c}var gf=new Map;function pn(n,e){let t=gf.get(n);t||(t=new Set,gf.set(n,t));let i=e;return t.add(i),()=>t.delete(i)}function Nn(n){let e=gf.get(n.type);if(e)for(let t of[...e])try{t(n)}catch(i){console.error("event listener failed for",n.type,i)}}function q0(n){return n==="road"?"road":n==="zone_res"||n==="zone_com"||n==="zone_ind"?"zone":n==="bulldoze"?"bulldoze":n.startsWith("build:")?"build":null}var C2=2e4;function xf(n){let e=-1/0,t=[pn("applied",i=>{let s=q0(i.tool);s&&n.play(s)}),pn("denied",()=>n.play("denied")),pn("milestone",()=>n.play("milestone")),pn("grew",i=>{i.up&&n.play("grow")}),pn("undo",()=>n.play("undo")),pn("month",i=>{let s=Date.now();i.record.income-i.record.expenses>0&&s-e>=C2?(e=s,n.play("cash")):n.play("month")})];return()=>t.forEach(i=>i())}var P2=.6,I2=120,L2=14,$0=.08,bf=class{constructor(){this.ctx=null;this.failed=!1;this.graph=null;this.music=null;this.ambience=null;this.sfxBuffers=null;this.rendering=!1;this.started=!1;this.volumes={sfx:.8,music:.5};this.ambienceParams={population:0,night:0,paused:!1};this.appSuspended=!1;this.hidden=!1;this.musicOn=!1;this.timer=null;this.suspendTimer=null;this.lastPlay=new Map;this.lastVariant=new Map;this.voices=0;this.resumeAskedAt=-1/0;this.rng=kn(os())}unlock(){if(this.failed||!this.ctx&&!this.create())return;let e=this.ctx;this.appSuspended||!this.wantsToRun()||e.state!=="running"&&(this.resumeContext(),this.playSilence())}play(e){let t=this.ctx,i=this.graph;if(!t||!i||!this.wantsToRun()||this.volumes.sfx<=0||t.state!=="running"&&Date.now()-this.resumeAskedAt>300)return;let s=Dr[e];if(!s)return;let r=Date.now(),o=this.lastPlay.get(e);if(o!==void 0&&r-o<s.gapMs&&r>=o||this.voices>=L2&&e!=="milestone")return;this.lastPlay.set(e,r);let a=t.currentTime,l=ot(t,1+Qe(this.rng,-$0,$0));l.connect(i.sfx);let c=this.sfxBuffers?.get(e);if(this.voices++,c&&c.length>0){let u=Math.floor(this.rng()*c.length);c.length>1&&u===this.lastVariant.get(e)&&(u=(u+1)%c.length),this.lastVariant.set(e,u);let d=t.createBufferSource();d.buffer=c[u],d.playbackRate.value=Math.pow(2,Qe(this.rng,-s.cents,s.cents)/1200),d.connect(l),d.onended=()=>{this.voices=Math.max(0,this.voices-1),l.disconnect()},d.start(a)}else s.recipe(t,l,a,this.rng),setTimeout(()=>{this.voices=Math.max(0,this.voices-1),l.disconnect()},(s.length+.2)*1e3);e==="milestone"&&this.duckMusic(a)}setAmbience(e){e&&(this.ambienceParams={population:Number.isFinite(e.population)?Math.max(0,e.population):0,night:Number.isFinite(e.night)?as(e.night,0,1):0,paused:!!e.paused},this.ambience&&this.ctx&&this.ambience.set(this.ambienceParams,this.ctx.currentTime))}setVolumes(e,t){this.volumes={sfx:Number.isFinite(e)?as(e,0,1):this.volumes.sfx,music:Number.isFinite(t)?as(t,0,1):this.volumes.music},!(!this.ctx||!this.graph)&&(hf(this.graph,this.volumes.sfx,this.volumes.music,this.ctx.currentTime),this.updateMusicOn(),this.updateRunState())}suspend(){this.appSuspended=!0,this.updateRunState()}resume(){this.appSuspended=!1,this.updateRunState()}stats(){return{state:this.ctx?this.ctx.state:this.failed?"unavailable":"locked",voices:this.voices,sfxReady:this.sfxBuffers!==null,musicOn:this.musicOn,sampleRate:this.ctx?this.ctx.sampleRate:0}}create(){let e=globalThis,t=e.AudioContext??e.webkitAudioContext;if(!t)return this.failed=!0,!1;try{let i=e.navigator?.audioSession;i&&i.type!=="ambient"&&(i.type="ambient")}catch{}try{let i=new t;this.ctx=i,this.graph=H0(i),hf(this.graph,this.volumes.sfx,this.volumes.music),i.onstatechange=()=>this.onStateChange(),this.watchVisibility()}catch(i){return console.warn("Cubopolis: audio is unavailable",i),this.failed=!0,this.ctx=null,this.graph=null,!1}return setTimeout(()=>this.guard(()=>this.startBackground()),0),!0}startBackground(){let e=this.ctx,t=this.graph;this.started||!e||!t||(this.started=!0,G0(e,t),this.ambience=new Uu(e,t.ambience,t.ambienceWet,os()),this.ambience.set(this.ambienceParams,e.currentTime),this.music=new Fu(e,t.music,t.musicWet,os()),this.updateMusicOn(),this.updateRunState(),this.prerender())}async prerender(){let e=this.ctx;if(!(!e||this.rendering||this.sfxBuffers)){this.rendering=!0;try{this.sfxBuffers=await Y0(e.sampleRate)}catch(t){console.warn("Cubopolis: could not pre-render sound effects",t)}finally{this.rendering=!1}}}watchVisibility(){let e=globalThis.document;if(!e||typeof e.addEventListener!="function")return;let t=()=>this.guard(()=>{this.hidden=e.visibilityState==="hidden",this.updateRunState()});e.addEventListener("visibilitychange",t),this.hidden=e.visibilityState==="hidden"}playSilence(){let e=this.ctx;if(e)try{let t=e.createBufferSource();t.buffer=e.createBuffer(1,1,e.sampleRate),t.connect(e.destination),t.start(0)}catch{}}wantsToRun(){return!this.appSuspended&&!this.hidden&&(this.volumes.sfx>0||this.volumes.music>0)}updateRunState(){let e=this.ctx,t=this.graph;if(!e||!t)return;let i=e.currentTime;if(this.wantsToRun())this.suspendTimer!==null&&(clearTimeout(this.suspendTimer),this.suspendTimer=null),t.master.gain.cancelScheduledValues(i),t.master.gain.setTargetAtTime(1,i,.04),e.state!=="running"&&this.resumeContext(),this.startTimer();else{if(this.stopTimer(),this.suspendTimer!==null)return;t.master.gain.cancelScheduledValues(i),t.master.gain.setTargetAtTime(0,i,.015),this.suspendTimer=setTimeout(()=>this.guard(()=>{if(this.suspendTimer=null,this.wantsToRun()||!this.ctx||this.ctx.state!=="running")return;let s=this.ctx.suspend();s&&typeof s.catch=="function"&&s.catch(()=>{})}),90)}}resumeContext(){let e=this.ctx;if(e)try{this.resumeAskedAt=Date.now();let t=e.resume();t&&typeof t.catch=="function"&&t.catch(()=>{})}catch{}}onStateChange(){this.guard(()=>{let e=this.ctx;e&&(e.state==="running"&&!this.wantsToRun()?this.updateRunState():e.state==="running"&&this.tick())})}startTimer(){this.timer!==null||!this.started||(this.timer=setInterval(()=>this.guard(()=>this.tick()),I2),this.tick())}stopTimer(){this.timer!==null&&(clearInterval(this.timer),this.timer=null)}updateMusicOn(){let e=this.volumes.music>.001;e&&!this.musicOn&&this.music&&this.ctx&&this.music.restart(this.ctx.currentTime+.3),this.musicOn=e}tick(){let e=this.ctx;if(!e||e.state!=="running"||!this.wantsToRun())return;let t=e.currentTime,i=t+P2;this.music&&this.musicOn&&((this.music.nextTime<t-.05||this.music.nextTime>t+60)&&this.music.restart(t+.2),this.music.scheduleUntil(i)),this.ambience&&this.volumes.sfx>0&&this.ambience.scheduleUntil(t,i)}duckMusic(e){let t=this.graph?.duck.gain;t&&(t.cancelScheduledValues(e),t.setTargetAtTime(.4,e,.04),t.setTargetAtTime(1,e+1.6,.6))}guard(e){try{e()}catch(t){console.warn("Cubopolis audio:",t)}}};function Z0(){let n=new bf,e=t=>(...i)=>n.guard(()=>t.apply(n,i));return{unlock:e(n.unlock),play:e(n.play),setAmbience:e(n.setAmbience),setVolumes:e(n.setVolumes),suspend:e(n.suspend),resume:e(n.resume),stats:()=>n.stats()}}var K0={0:1/0,1:.6,2:.25,3:.08},Ts=30;var yf=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],J0=240,Qa=36,j0=10,vf=5,zo=3,Q0=5,eg=15,tg=3,ng=.1,_f=20,kr=[0,6,18,45],Ho=[0,4,12,30],Go=[0,6,16,32],hr=[[0,0,0,0],[0,1,2,4],[0,2,4,7],[0,3,6,10]],dr=[[0,0,0,0],[0,1,2,4],[0,1,3,5],[0,2,4,7]],pi=3,Hi=2,el=[0,0,.38,.6],ig=.006,sg=25,Mf=.6,rg=30,og=20,ag=.22,lg=.55,cg=.05,ug=.05,hg=.065,dg=.055,zu=1,fg=60,pg=40,mg=10,gg=[0,30,50,70],xg=4,tl=90,Mn=[{name:"Settlement",population:0,reward:0},{name:"Hamlet",population:150,reward:1e3},{name:"Village",population:400,reward:2500},{name:"Town",population:1e3,reward:5e3},{name:"Small City",population:2500,reward:1e4},{name:"City",population:6e3,reward:2e4},{name:"Metropolis",population:12e3,reward:5e4}],nn=160;function bg(n,e){return Math.min(nn,Math.floor(n/25+e/40))}function D2(n){let e=n*n,t=new Int32Array(e);return t.fill(-1),{terrain:new Uint8Array(e),trees:new Uint8Array(e),kind:new Uint8Array(e),zone:new Uint8Array(e),level:new Uint8Array(e),variant:new Uint8Array(e),bld:t,distress:new Uint8Array(e),power:new Uint8Array(e),water:new Uint8Array(e),roadDist:new Uint8Array(e).fill(255),pollution:new Uint8Array(e),landValue:new Uint8Array(e),problems:new Uint8Array(e),police:new Uint8Array(e),fire:new Uint8Array(e),health:new Uint8Array(e),education:new Uint8Array(e),parks:new Uint8Array(e)}}function k2(){return{population:0,workforce:0,jobsCom:0,jobsInd:0,unemployment:0,demand:{res:0,com:0,ind:0},happiness:50,powerSupply:0,powerDemand:0,waterSupply:0,waterDemand:0,income:{res:0,com:0,ind:0,total:0},expenses:{roads:0,buildings:0,total:0},developed:{res:0,com:0,ind:0}}}function Hu(n=64,e=1,t="New City"){return{version:1,name:t,seed:e,size:n,day:0,timeOfDay:.35,speed:1,money:25e3,taxes:{res:9,com:9,ind:9},tiles:D2(n),buildings:[],stats:k2(),history:[],milestone:0,monthsInDebt:0,dirty:new Set,rev:{tiles:0,buildings:0,derived:0},needsRecompute:!0,undo:[]}}function Nr(n,e){n.dirty.add(e),n.rev.tiles++}function Gu(n){let e=n.size*n.size;for(let t=0;t<e;t++)n.dirty.add(t);n.rev.tiles++,n.rev.buildings++,n.rev.derived++}function Vu(n){let e=Math.sin((n-.25)*Math.PI*2);return Math.min(1,Math.max(0,(.15-e)/.4))}function Tf(n,e=30){return Math.floor(n/e)%12}function Ef(n,e=30){return Math.floor(n/(e*12))+1}var vg=Math.PI/4,_g=.95,Mg=38,wg=40;function jt(n,e,t){return n<e?e:n>t?t:n}function N2(n){let e=Math.PI*2;return n=n%e,n<=-Math.PI?n+=e:n>Math.PI&&(n-=e),n}function Af(n){let e=Number.isFinite(n)&&n>0?n:64;return{minDistance:8,maxDistance:Math.max(90,e*1.4),minPitch:.55,maxPitch:1.35,mapSize:e}}function Wu(n){return{tx:n/2,tz:n/2,yaw:vg,pitch:_g,distance:Mg}}function Xu(n,e){return e.tx=n.tx,e.tz=n.tz,e.yaw=n.yaw,e.pitch=n.pitch,e.distance=n.distance,e}function Es(n,e){let t=e.mapSize;return n.tx=Number.isFinite(n.tx)?jt(n.tx,0,t):t/2,n.tz=Number.isFinite(n.tz)?jt(n.tz,0,t):t/2,n.yaw=Number.isFinite(n.yaw)?n.yaw:vg,n.pitch=Number.isFinite(n.pitch)?jt(n.pitch,e.minPitch,e.maxPitch):_g,n.distance=Number.isFinite(n.distance)?jt(n.distance,e.minDistance,e.maxDistance):Mg,n}function Sg(n,e){let t=Math.cos(n.pitch)*n.distance;return e.x=n.tx+Math.sin(n.yaw)*t,e.y=Math.sin(n.pitch)*n.distance,e.z=n.tz+Math.cos(n.yaw)*t,e}function Tg(n,e,t,i,s){return s.x=n/t*2-1,s.y=1-e/i*2,s}function Eg(n,e,t,i,s){let r=Math.cos(n.pitch),o=Math.sin(n.pitch),a=Math.cos(n.yaw),l=Math.sin(n.yaw),c=r*l,u=o,d=r*a,h=a,f=-l,p=-o*l,x=r,g=-o*a,m=Math.tan(e.fov*Math.PI/360)/(e.zoom>0?e.zoom:1),b=t*m*e.aspect,w=i*m,y=-c+h*b+p*w,_=-u+x*w,M=-d+f*b+g*w;if(_>-1e-6)return null;let v=o*n.distance/-_;return s.x=n.tx+c*n.distance+y*v,s.z=n.tz+d*n.distance+M*v,s}function Rf(n,e){return e.x=Math.cos(n),e.z=-Math.sin(n),e}function Cf(n,e){return e.x=-Math.sin(n),e.z=-Math.cos(n),e}function Ag(n,e,t,i,s){if(!(i>0)||!Number.isFinite(i))return 1;let r=jt(n.distance*i,s.minDistance,s.maxDistance),o=r/n.distance;return n.tx=e+(n.tx-e)*o,n.tz=t+(n.tz-t)*o,n.distance=r,o}function Rg(n,e,t,i){if(!Number.isFinite(i)||i===0)return;let s=Math.cos(i),r=Math.sin(i),o=n.tx-e,a=n.tz-t;n.tx=e+o*s+a*r,n.tz=t-o*r+a*s,n.yaw+=i}var yg=12;function Pf(n,e,t,i,s,r,o,a,l){let c=t-n,u=i-e,d=o-s,h=a-r,f=Math.hypot(c,u),p=Math.hypot(d,h),x=f>=yg&&p>=yg;return l.mx0=(n+t)/2,l.my0=(e+i)/2,l.mx1=(s+o)/2,l.my1=(r+a)/2,l.scale=x?p/f:1,l.twist=x?N2(Math.atan2(h,d)-Math.atan2(u,c)):0,l}var U2={mx0:0,my0:0,mx1:0,my1:0,scale:1,twist:0};function Cg(n,e,t,i,s,r,o,a,l){let c=s-n,u=r-e,d=o-t,h=a-i;if(Math.max(Math.hypot(c,u),Math.hypot(d,h))<l)return"pending";let f=Math.abs(u),p=Math.abs(h),x=f>1.5*Math.abs(c)&&p>1.5*Math.abs(d),g=u*h>0&&Math.min(f,p)>.5*Math.max(f,p),m=Math.abs(t-n)>Math.abs(i-e),b=Pf(n,e,t,i,s,r,o,a,U2),w=Math.abs(b.scale-1)<.12&&Math.abs(b.twist)<.15;return x&&g&&m&&w?"tilt":"transform"}function Pg(n,e,t,i){if(!(t>0))return n.x=e,n.v=0,n;let s=2/t,r=n.x-e,o=Math.exp(-s*i),a=(n.v+s*r)*i;return n.x=e+(r+a)*o,n.v=(n.v-s*a)*o,n}function If(n,e,t){return e>t*2?n<t?-jt((t-n)/t,0,1):n>e-t?jt((n-(e-t))/t,0,1):0:0}var Yu=.1,Ig=.2,Lg=.09,O2=.1,F2=4,il=class{constructor(e){this.target=new Z;this.camera=null;this.rev=0;this.vel={tx:0,tz:0,yaw:0,pitch:0,distance:0};this.panSmooth=Yu;this.anchorOn=!1;this.anchorX=0;this.anchorZ=0;this.flingOn=!1;this.fvx=0;this.fvz=0;this.writtenX=NaN;this.writtenZ=NaN;this.spring={x:0,v:0};this.pos={x:0,y:0,z:0};this.lim=Af(e),this.view=Wu(this.lim.mapSize),this.goal=Wu(this.lim.mapSize),this.writeTarget()}get yaw(){return this.view.yaw}set yaw(e){Number.isFinite(e)&&(this.view.yaw=this.goal.yaw=e,this.vel.yaw=0,this.rev++)}get pitch(){return this.view.pitch}set pitch(e){Number.isFinite(e)&&(this.view.pitch=this.goal.pitch=jt(e,this.lim.minPitch,this.lim.maxPitch),this.vel.pitch=0,this.rev++)}get distance(){return this.view.distance}set distance(e){Number.isFinite(e)&&(this.view.distance=this.goal.distance=jt(e,this.lim.minDistance,this.lim.maxDistance),this.vel.distance=0,this.anchorOn=!1,this.rev++)}focus(e,t){this.sync(),!(!Number.isFinite(e)||!Number.isFinite(t))&&(this.flingOn=!1,this.anchorOn=!1,this.goal.tx=e+.5,this.goal.tz=t+.5,Es(this.goal,this.lim),this.panSmooth=Ig)}update(e){this.sync();let t=Number.isFinite(e)?jt(e,0,.1):0;if(t<=0)return;let i=this.view,s=this.goal,r=this.lim.mapSize,o=i.tx,a=i.tz,l=i.yaw,c=i.pitch,u=i.distance;if(this.flingOn){let h=this.fvx*t,f=this.fvz*t;s.tx=jt(s.tx+h,0,r),s.tz=jt(s.tz+f,0,r),i.tx=jt(i.tx+h,0,r),i.tz=jt(i.tz+f,0,r),(s.tx<=0||s.tx>=r)&&(this.fvx=0),(s.tz<=0||s.tz>=r)&&(this.fvz=0);let p=Math.exp(-F2*t);this.fvx*=p,this.fvz*=p,Math.hypot(this.fvx,this.fvz)<Math.max(.25,i.distance*.015)&&(this.flingOn=!1)}let d=i.distance;if(i.distance=this.chase(i.distance,s.distance,"distance",O2,t),this.anchorOn){let h=i.distance/d;h!==1&&(i.tx=this.anchorX+(i.tx-this.anchorX)*h,i.tz=this.anchorZ+(i.tz-this.anchorZ)*h,s.tx=jt(this.anchorX+(s.tx-this.anchorX)*h,0,r),s.tz=jt(this.anchorZ+(s.tz-this.anchorZ)*h,0,r)),i.distance===s.distance&&(this.anchorOn=!1)}i.yaw=this.chase(i.yaw,s.yaw,"yaw",Lg,t),i.pitch=this.chase(i.pitch,s.pitch,"pitch",Lg,t),i.tx=this.chase(i.tx,s.tx,"tx",this.panSmooth,t),i.tz=this.chase(i.tz,s.tz,"tz",this.panSmooth,t),i.tx===s.tx&&i.tz===s.tz&&(this.panSmooth=Yu),Es(i,this.lim),this.normalizeYaw(),(i.tx!==o||i.tz!==a||i.yaw!==l||i.pitch!==c||i.distance!==u)&&(this.writeTarget(),this.rev++)}apply(e){this.sync(),this.camera=e;let t=this.view;Sg(t,this.pos),e.position.set(this.pos.x,this.pos.y,this.pos.z),e.up.set(0,1,0),e.lookAt(t.tx,0,t.tz);let i=Math.round(jt(t.distance*.025,.1,2)*100)/100,s=Math.ceil(Math.max(t.distance*4+60,t.distance+this.lim.mapSize*1.5+20)/10)*10;(e.near!==i||e.far!==s)&&(e.near=i,e.far=s,e.updateProjectionMatrix()),e.updateMatrixWorld()}get current(){return this.sync(),this.view}get limits(){return this.lim}direct(){this.sync(),Es(this.goal,this.lim);let e=this.view,t=e.tx!==this.goal.tx||e.tz!==this.goal.tz||e.yaw!==this.goal.yaw||e.pitch!==this.goal.pitch||e.distance!==this.goal.distance;Xu(this.goal,e),this.vel.tx=this.vel.tz=this.vel.yaw=this.vel.pitch=this.vel.distance=0,this.panSmooth=Yu,this.anchorOn=!1,this.normalizeYaw(),t&&(this.writeTarget(),this.rev++)}glide(){this.sync(),Es(this.goal,this.lim)}halt(){this.sync(),Xu(this.view,this.goal),this.vel.tx=this.vel.tz=this.vel.yaw=this.vel.pitch=this.vel.distance=0,this.flingOn=!1,this.anchorOn=!1,this.panSmooth=Yu}fling(e,t){!Number.isFinite(e)||!Number.isFinite(t)||(this.fvx=e,this.fvz=t,this.flingOn=Math.hypot(e,t)>0)}flingSpeed(){return this.flingOn?Math.hypot(this.fvx,this.fvz):0}zoomBy(e,t,i){this.sync(),!(!(e>0)||!Number.isFinite(e))&&(this.goal.distance=jt(this.goal.distance*e,this.lim.minDistance,this.lim.maxDistance),t!==void 0&&i!==void 0&&Number.isFinite(t)&&Number.isFinite(i)?(this.anchorOn=!0,this.anchorX=t,this.anchorZ=i):this.anchorOn=!1)}setMapSize(e){this.sync(),this.lim=Af(e),Es(this.goal,this.lim),Es(this.view,this.lim),this.flingOn=!1,this.anchorOn=!1,this.writeTarget(),this.rev++}reset(e=!1){this.sync();let t=Wu(this.lim.mapSize);t.yaw=this.view.yaw+Math.atan2(Math.sin(t.yaw-this.view.yaw),Math.cos(t.yaw-this.view.yaw)),Xu(t,this.goal),this.flingOn=!1,this.anchorOn=!1,e?this.direct():this.panSmooth=Ig}isMoving(){let e=this.view,t=this.goal;return this.flingOn||e.tx!==t.tx||e.tz!==t.tz||e.yaw!==t.yaw||e.pitch!==t.pitch||e.distance!==t.distance}lens(e,t,i){let s=this.camera;return s?(i.fov=s.fov,i.aspect=s.aspect>0?s.aspect:e>0&&t>0?e/t:1,i.zoom=s.zoom>0?s.zoom:1):(i.fov=wg,i.aspect=e>0&&t>0?e/t:1,i.zoom=1),i}chase(e,t,i,s,r){if(e===t&&this.vel[i]===0)return e;let o=this.spring;o.x=e,o.v=this.vel[i],Pg(o,t,s,r);let a=i==="yaw"||i==="pitch"?1e-5:1e-4;return Math.abs(o.x-t)<a&&Math.abs(o.v)<a*20?(this.vel[i]=0,t):(this.vel[i]=o.v,o.x)}normalizeYaw(){let e=Math.PI*2;if(Math.abs(this.view.yaw)<e*4)return;let t=Math.round(this.view.yaw/e)*e;this.view.yaw-=t,this.goal.yaw-=t}writeTarget(){this.target.set(this.view.tx,0,this.view.tz),this.writtenX=this.target.x,this.writtenZ=this.target.z}sync(){let e=this.target;e.x===this.writtenX&&e.z===this.writtenZ&&e.y===0||(this.view.tx=this.goal.tx=e.x,this.view.tz=this.goal.tz=e.z,Es(this.view,this.lim),Es(this.goal,this.lim),this.vel.tx=this.vel.tz=0,this.flingOn=!1,this.anchorOn=!1,this.writeTarget(),this.rev++)}};function B2(n,e){return!n||!e?n===e:n.x===e.x&&n.z===e.z}function Dg(n,e,t){let i=Math.max(0,t-1),s=Number.isFinite(n)?Math.floor(n):0,r=Number.isFinite(e)?Math.floor(e):0;return{x:Math.min(i,Math.max(0,s)),z:Math.min(i,Math.max(0,r))}}function Lf(n,e){if(!n||!Number.isFinite(n.x)||!Number.isFinite(n.z))return null;let t=Math.max(0,e-1);return Number.isInteger(n.x)&&Number.isInteger(n.z)&&n.x>=0&&n.z>=0&&n.x<=t&&n.z<=t?n:{x:Math.min(t,Math.max(0,Math.round(n.x))),z:Math.min(t,Math.max(0,Math.round(n.z)))}}var qu=class{constructor(e){this.single=e;this.a=null;this.b=null}move(e){return e?!this.a||!this.b?(this.a={x:e.x,z:e.z},this.b={x:e.x,z:e.z},!0):B2(e,this.b)?!1:(this.b={x:e.x,z:e.z},this.single&&(this.a={x:e.x,z:e.z}),!0):!1}get started(){return this.a!==null}};var $u=10,z2=350,H2=10,G2=.12,V2=.005,W2=.008,X2=.005,kg=48,Y2=.3,q2=.35,$2=.9,Z2=1.6,K2=1.4,J2=100,j2=70,Q2=120,eS=5,Ur=16,Ng={KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",KeyQ:"rotL",KeyE:"rotR",Equal:"in",NumpadAdd:"in",Minus:"out",NumpadSubtract:"out"};function tS(n){let e=Ng[n.code];return e||(n.key==="+"||n.key==="="?"in":n.key==="-"||n.key==="_"?"out":Ng[n.key])}function nS(n){let e=n;return!e||typeof e.tagName!="string"?!1:e.isContentEditable===!0||e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.tagName==="SELECT"}function Df(n){return n==="inspect"?"inspect":typeof n=="string"&&n.startsWith("build:")?"build":"drag"}function Gi(n,e,t){try{return e()}catch(i){return console.error(`input: ${n} failed`,i),t}}function Zu(n,e,t,i={}){let s=new il(t),r=s.limits.mapSize,o="inspect",a=!0,l=!1,c=i.now??(()=>typeof performance<"u"?performance.now():Date.now()),u=F=>i.now?i.now():F.timeStamp>0?F.timeStamp:c(),d=0,h=0,f=0,p=0;function x(){let F=n.getBoundingClientRect();d=F.left,h=F.top,f=F.width,p=F.height}let g={fov:40,aspect:1,zoom:1},m={x:0,y:0},b={x:0,z:0},w={x:0,z:0},y={x:0,z:0},_={x:0,z:0},M={mx0:0,my0:0,mx1:0,my1:0,scale:1,twist:0};function A(F,le,ze,qe){return f>0&&p>0?(s.lens(f,p,g),Tg(le,ze,f,p,m),Eg(F,g,m.x,m.y,qe)):null}let v=[],S="idle",C=!1,P=!1,D=!1,N=!1,I=null,U=-1,W=!1,O=null,te=0,X=-1,q=-1,$=-1,he="pending",Q=0,fe=0,re=0,pe=0,k=0,z=!1,de=new Float64Array(Ur),Ee=new Float64Array(Ur),ge=new Float64Array(Ur),Ue=0,vt=0,G=0,me=0,ke=new Map;function xe(F){for(let le of v)if(le.id===F)return le}function Ve(F){return Math.hypot(F.x-F.sx,F.y-F.sy)}function Je(){Ue=0,G=me=0}function dt(F,le,ze){vt=(vt+1)%Ur,de[vt]=F,Ee[vt]=le+G,ge[vt]=ze+me,Ue<Ur&&Ue++}function _t(F,le){Ue?(G=Ee[vt]-F,me=ge[vt]-le):G=me=0}function Dt(F,le,ze){let qe=Lf(Gi("pick",()=>e.pick(F,le),null),r);if(qe||!ze)return qe;let lt=A(s.current,F,le,b);return lt?Dg(lt.x,lt.z,r):null}function V(F){I=new qu(Df(o)==="build"),U=F.id,W=!1,O=null,te=0,on()}function on(){let F=I;if(!F)return;X=s.rev;let le=xe(U);if(!le)return;let ze=Dt(le.x,le.y,F.started);if(!F.move(ze)||!F.a||!F.b)return;let qe={x:F.a.x,z:F.a.z},lt={x:F.b.x,z:F.b.z},Pt=o;O=Gi("plan",()=>e.plan(Pt,qe,lt),null);let wt=O;Gi("preview",()=>e.preview(wt),void 0)}function At(){let F=I,le=O;if(I=null,U=-1,O=null,!F||!F.started||!F.a||!F.b)return;let ze=F.a,qe=F.b,lt=o,Pt=le??Gi("plan",()=>e.plan(lt,{x:ze.x,z:ze.z},{x:qe.x,z:qe.z}),null);Pt&&Gi("apply",()=>e.apply(Pt),void 0),Gi("preview",()=>e.preview(null),void 0)}function L(){let F=I;I=null,U=-1,O=null,F&&F.started&&Gi("preview",()=>e.preview(null),void 0)}function T(){let F=v[0],le=v[1];q=F.id,$=le.id,F.px=F.x,F.py=F.y,le.px=le.x,le.py=le.y,Q=F.x,fe=F.y,re=le.x,pe=le.y,he="pending",k=0,z=!1,S="multi",D=!1,_t((F.x+le.x)/2,(F.y+le.y)/2)}function Y(){let F=v[0];if(!F)return;if(!D){if(Ve(F)<=$u)return;D=!0}if(F.x===F.px&&F.y===F.py)return;let le=s.goal,ze=A(le,F.px,F.py,b),qe=ze?A(le,F.x,F.y,w):null;ze&&qe&&(le.tx+=ze.x-qe.x,le.tz+=ze.z-qe.z,s.direct()),F.px=F.x,F.py=F.y}function ee(){let F=xe(q),le=xe($);if(!F||!le)return;if(he==="pending"){if(he=Cg(Q,fe,re,pe,F.x,F.y,le.x,le.y,H2),he==="pending")return;he==="tilt"&&Je()}let ze=s.goal;if(he==="tilt"){let qe=(F.y-F.py+(le.y-le.py))/2;ze.pitch+=qe*V2}else{Pf(F.px,F.py,le.px,le.py,F.x,F.y,le.x,le.y,M);let qe=A(ze,M.mx0,M.my0,b);if(qe){let lt=qe.x,Pt=qe.z;z?Rg(ze,lt,Pt,M.twist):(k+=M.twist,Math.abs(k)>G2&&(z=!0)),Ag(ze,lt,Pt,1/M.scale,s.limits);let wt=A(ze,M.mx1,M.my1,w);wt&&(ze.tx+=lt-wt.x,ze.tz+=Pt-wt.z)}}F.px=F.x,F.py=F.y,le.px=le.x,le.py=le.y,s.direct()}function ie(){let F=v[0];if(!F)return;let le=F.x-F.px,ze=F.y-F.py;if(!le&&!ze)return;let qe=s.goal;qe.yaw-=le*W2,qe.pitch+=ze*X2,s.direct(),F.px=F.x,F.py=F.y}function ye(){N&&(N=!1,S==="pan"?Y():S==="multi"?ee():S==="rotate"&&ie())}function _e(F,le,ze){if(!Ue)return;let qe=vt,lt=de[qe];if(F-lt>j2)return;let Pt=qe;for(let aa=1;aa<Ue;aa++){let Nl=(qe-aa+Ur)%Ur;if(lt-de[Nl]>J2)break;Pt=Nl}let wt=(lt-de[Pt])/1e3;if(wt<.012)return;let Os=(Ee[qe]-Ee[Pt])/wt,li=(ge[qe]-ge[Pt])/wt;if(Math.hypot(Os,li)<Q2)return;let Ii=.04,Kr=s.goal,Mr=A(Kr,le,ze,b),Fs=Mr?A(Kr,le-Os*Ii,ze-li*Ii,w):null;if(!Mr||!Fs)return;let Jr=(Fs.x-Mr.x)/Ii,Bs=(Fs.z-Mr.z)/Ii,jr=Kr.distance*eS,Qr=Math.hypot(Jr,Bs);Qr>jr&&(Jr*=jr/Qr,Bs*=jr/Qr),s.fling(Jr,Bs)}function se(F){try{n.hasPointerCapture?.(F)&&n.releasePointerCapture(F)}catch{}}function oe(){let F=v.splice(0);I&&L(),S="idle",C=!1,D=!1,P=!1,N=!1,Je();for(let le of F)se(le.id)}function Me(){if(!v.length){S="idle",C=!1,D=!1,P=!1;return}if(S==="multi")if(v.length>=2)(v[0].id!==q||v[1].id!==$)&&T();else{let F=v[0];F.px=F.x,F.py=F.y,he==="tilt"?Je():_t(F.x,F.y),S="pan",D=!0,P=!1}else S!=="inert"&&(S="inert")}function Ye(F){if(l||(Gi("touched",()=>e.touched(),void 0),!a))return;let le=F.pointerType==="mouse";if(le){if(v.length||F.button>2)return;F.preventDefault()}else v.some(wt=>wt.mouse)&&oe(),F.isPrimary&&v.length&&oe();if(xe(F.pointerId))return;ye(),v.length||(x(),Je());let ze=F.clientX-d,qe=F.clientY-h,lt={id:F.pointerId,mouse:le,x:ze,y:qe,px:ze,py:qe,sx:ze,sy:qe,t0:u(F)};v.push(lt);try{n.setPointerCapture(F.pointerId)}catch{}let Pt=s.flingSpeed()>Math.max(1,s.current.distance*.3);s.halt(),v.length===1?(C=!1,D=!1,P=!1,le&&F.button!==0?(S="pan",C=!0,D=!0):le&&(F.altKey||F.ctrlKey)?(S="rotate",C=!0):Df(o)==="inspect"?(S="pan",P=!Pt):(S="plan",V(lt))):(I&&L(),C=!0,P=!1,(S!=="multi"||v[0].id!==q||v[1].id!==$)&&T())}function Ae(F){let le=xe(F.pointerId);if(!le)return;if(le.mouse&&F.buttons===0){we(F);return}le.x=F.clientX-d,le.y=F.clientY-h,N=!0;let ze=u(F);if(S==="plan")le.id===U&&(!W&&Ve(le)>$u&&(W=!0),on());else if(S==="pan")P&&Ve(le)>$u&&(P=!1),dt(ze,le.x,le.y);else if(S==="multi"&&he!=="tilt"&&(le.id===q||le.id===$)){let qe=xe(q),lt=xe($);qe&&lt&&dt(ze,(qe.x+lt.x)/2,(qe.y+lt.y)/2)}}function we(F){F.type==="pointerup"&&!l&&Gi("touched",()=>e.touched(),void 0);let le=xe(F.pointerId);if(!le)return;Number.isFinite(F.clientX)&&Number.isFinite(F.clientY)&&(le.x=F.clientX-d,le.y=F.clientY-h);let ze=u(F);if(N=!0,ye(),v.splice(v.indexOf(le),1),se(le.id),S==="plan"&&le.id===U)At();else if(S==="pan")if(P&&!C&&ze-le.t0<=z2&&Ve(le)<=$u&&Df(o)==="inspect"){let lt=Lf(Gi("pick",()=>e.pick(le.x,le.y),null),r);Gi("inspect",()=>e.inspect(lt),void 0)}else D&&v.length===0&&_e(ze,le.x,le.y);Me()}function Xe(F){let le=xe(F.pointerId);le&&(v.splice(v.indexOf(le),1),se(le.id),S==="plan"&&le.id===U&&L(),P=!1,Me())}function je(F){xe(F.pointerId)&&Xe(F)}function rt(F){if(F.preventDefault(),l||!a)return;x();let le=F.deltaY;if(F.deltaMode===1?le*=16:F.deltaMode===2&&(le*=p||400),!Number.isFinite(le)||le===0)return;let ze=Math.exp(jt(le*(F.ctrlKey?.01:.0015),-.5,.5));s.fling(0,0);let qe=A(s.current,F.clientX-d,F.clientY-h,b);qe?s.zoomBy(ze,qe.x,qe.z):s.zoomBy(ze)}function H(F){if(l||nS(F.target))return;if(F.key==="Escape"||F.key==="Esc"){Zn.cancel();return}if(!a||F.metaKey||F.ctrlKey||F.altKey)return;let le=tS(F);le&&ke.set(F.code||F.key,le)}function Se(F){ke.delete(F.code||F.key)}function ce(F){if(!ke.size||F<=0)return;let le=0,ze=0,qe=0,lt=0;for(let wt of ke.values())wt==="up"?le=1:wt==="down"?le=le===1?0:-1:wt==="right"?ze=1:wt==="left"?ze=ze===1?0:-1:wt==="rotL"?qe=1:wt==="rotR"?qe=qe===1?0:-1:wt==="out"?lt=1:wt==="in"&&(lt=lt===1?0:-1);if(!le&&!ze&&!qe&&!lt)return;s.fling(0,0);let Pt=s.goal;if(le||ze){let wt=Pt.distance*$2*F;Rf(Pt.yaw,y),Cf(Pt.yaw,_),Pt.tx+=(y.x*ze+_.x*le)*wt,Pt.tz+=(y.z*ze+_.z*le)*wt}qe&&(Pt.yaw+=qe*Z2*F),lt&&(Pt.distance*=Math.exp(lt*K2*F)),s.glide()}function Te(F){if(S!=="plan"||!I||!I.started||!W||F<=0){te=0;return}let le=xe(U);if(!le)return;let ze=If(le.x,f,kg),qe=If(le.y,p,kg);if(!ze&&!qe){te=0;return}let lt=A(s.current,le.x,le.y,b),Pt=.5;if(!lt||lt.x<-Pt||lt.z<-Pt||lt.x>r+Pt||lt.z>r+Pt){te=0;return}te+=F;let wt=s.goal,Os=wt.distance*Y2*Math.min(1,te/q2)*F,li=ze?Math.sign(ze)*(.3+.7*Math.abs(ze)):0,Ii=qe?-Math.sign(qe)*(.3+.7*Math.abs(qe)):0;Rf(wt.yaw,y),Cf(wt.yaw,_),wt.tx+=(y.x*li+_.x*Ii)*Os,wt.tz+=(y.z*li+_.z*Ii)*Os,s.direct()}let Ce=[];function ae(F,le,ze,qe){F&&(F.addEventListener(le,ze,qe),Ce.push(()=>F.removeEventListener(le,ze,qe)))}let Be=F=>{F.cancelable&&F.preventDefault()},Oe=i.docTarget!==void 0?i.docTarget:n.ownerDocument??(typeof document<"u"?document:null),Ct=i.keyTarget!==void 0?i.keyTarget:n.ownerDocument?.defaultView??(typeof window<"u"?window:null),pt=n.style;pt&&(pt.touchAction="none",pt.setProperty?.("user-select","none"),pt.setProperty?.("-webkit-user-select","none"),pt.setProperty?.("-webkit-touch-callout","none"),pt.setProperty?.("-webkit-tap-highlight-color","transparent")),ae(n,"pointerdown",Ye),ae(n,"pointermove",Ae),ae(n,"pointerup",we),ae(n,"pointercancel",Xe),ae(n,"lostpointercapture",je),ae(n,"wheel",rt,{passive:!1}),ae(n,"touchmove",Be,{passive:!1}),ae(n,"contextmenu",Be),ae(n,"dblclick",Be),ae(n,"selectstart",Be),ae(Oe,"gesturestart",Be,{passive:!1}),ae(Oe,"gesturechange",Be,{passive:!1}),ae(Oe,"gestureend",Be,{passive:!1}),ae(Oe,"visibilitychange",()=>{Oe.visibilityState==="hidden"&&(oe(),ke.clear())}),ae(Ct,"keydown",H),ae(Ct,"keyup",Se),ae(Ct,"blur",()=>{ke.clear(),oe()});let Zn={rig:s,setTool(F){typeof F=="string"&&(o=F,I&&L(),S==="plan"&&(S="inert"),P=!1)},getTool(){return o},cancel(){I&&L(),S==="plan"&&(S="inert")},update(F){if(l)return;let le=Number.isFinite(F)?jt(F,0,.1):0;ye(),a&&ce(le),Te(le),s.update(le),S==="plan"&&I&&s.rev!==X&&(s.camera&&s.apply(s.camera),on())},setMapSize(F){F>0&&(s.setMapSize(F),r=s.limits.mapSize,I&&L(),S==="plan"&&(S="inert"))},dispose(){if(!l){oe(),ke.clear();for(let F of Ce)F();Ce.length=0,l=!0}},setEnabled(F){a=!!F,a||(oe(),ke.clear())},isEnabled(){return a},isGesturing(){return v.length>0},groundAt(F,le){v.length||x();let ze=A(s.current,F,le,b);return ze?{x:ze.x,z:ze.z}:null}};return Zn}var kf="cubopolis:save:",Ug="cubopolis:settings",sl=":pending",iS=66,sS=5e3,rS=["light","medium","heavy","selection","success","warning","error"],oS=["low","medium","high"],aS=200,lS=64;function Nf(n){return String(n??"").replace(/[^A-Za-z0-9_-]/g,"_").slice(0,40)||"default"}function cS(){return{quality:"high",sfxVolume:.8,musicVolume:.5,haptics:!0,tips:!0,seenTips:[]}}function Og(n,e){return typeof n=="number"&&Number.isFinite(n)?Math.min(1,Math.max(0,n)):e}function Fg(n){let e=cS();if(!n||typeof n!="object"||Array.isArray(n))return e;let t=n,i=[];if(Array.isArray(t.seenTips)){for(let s of t.seenTips)if(!(typeof s!="string"||s.length===0||s.length>lS||i.includes(s))&&(i.push(s),i.length>=aS))break}return{quality:oS.includes(t.quality)?t.quality:e.quality,sfxVolume:Og(t.sfxVolume,e.sfxVolume),musicVolume:Og(t.musicVolume,e.musicVolume),haptics:typeof t.haptics=="boolean"?t.haptics:e.haptics,tips:typeof t.tips=="boolean"?t.tips:e.tips,seenTips:i}}function rl(n,e,t){return new Promise((i,s)=>{let r=!1,o=setTimeout(()=>{r||(r=!0,s(new Error(`the app did not answer '${String(e.op)}'`)))},t),a=(l,c)=>{r||(r=!0,clearTimeout(o),l?i(c):s(c instanceof Error?c:new Error(String(c))))};try{Promise.resolve(n.postMessage(e)).then(l=>a(!0,l),l=>a(!1,l))}catch(l){a(!1,l)}})}function uS(n){let e=n.timeoutMs??sS,t=!0,i=-1/0,s=()=>{try{return n.handler()}catch{return null}},r=()=>{try{return n.storage()}catch{return null}},o=u=>{try{let d=r()?.getItem(u);return typeof d=="string"?d:null}catch{return null}},a=(u,d)=>{try{let h=r();return h?(h.setItem(u,d),!0):!1}catch{return!1}},l=u=>{try{r()?.removeItem(u)}catch{}};return{get native(){return s()!==null},haptic(u){try{if(!t)return;let d=n.now();if(d-i<iS)return;i=d;let h=s();if(h){let f=rS.includes(u)?u:"light";rl(h,{op:"haptic",style:f},e).catch(()=>{})}else n.webHaptic&&n.webHaptic()}catch{}},setHapticsEnabled(u){t=u!==!1},async storeSave(u,d){let h=Nf(u),f=kf+h,p=a(f,d),x=s();if(x)try{if(await rl(x,{op:"save",slot:h,data:d},e)===!1)throw new Error("the app refused the save");l(f+sl);return}catch(g){if(p){a(f+sl,"1"),console.warn("Cubopolis: saving to the app failed, kept a browser copy:",g);return}throw new Error(`Could not save the city: ${g instanceof Error?g.message:String(g)}`)}if(!p)throw new Error("Could not save the city: storage is full or unavailable.");pS()},async loadSave(u){let d=Nf(u),h=kf+d,f=o(h),p=s();if(!p)return f;if(f!==null&&o(h+sl)!==null)return rl(p,{op:"save",slot:d,data:f},e).then(()=>l(h+sl),()=>{}),f;try{let x=await rl(p,{op:"load",slot:d},e);if(typeof x=="string"&&x.length>0)return x}catch(x){console.warn("Cubopolis: loading from the app failed, using the browser copy:",x)}return f},async deleteSave(u){let d=Nf(u),h=kf+d;l(h),l(h+sl);let f=s();if(f)try{await rl(f,{op:"delete",slot:d},e)}catch(p){console.warn("Cubopolis: deleting the save in the app failed:",p)}},loadSettings(){let u=null,d=o(Ug);if(d!==null)try{u=JSON.parse(d)}catch{u=null}let h=Fg(u);return t=h.haptics,h},saveSettings(u){let d=Fg(u);t=d.haptics,a(Ug,JSON.stringify(d))}}}var fr=globalThis;function zg(){try{let n=fr.webkit?.messageHandlers?.cubopolis;return n&&typeof n.postMessage=="function"?n:null}catch{return null}}function hS(){try{let n=fr.localStorage;return n&&typeof n.getItem=="function"?n:null}catch{return null}}function dS(){try{let n=fr.navigator;if(!n||!fr.document)return!1;let e=n.userAgent||"";return/iPhone|iPad|iPod/.test(e)||/Macintosh/.test(e)&&(n.maxTouchPoints||0)>1}catch{return!1}}var Ku=null;function fS(){let n=fr.document;if(!(!n||!n.body)){if(!Ku||!Ku.isConnected){let e=n.createElement("label");e.setAttribute("aria-hidden","true"),e.style.display="none";let t=n.createElement("input");t.type="checkbox",t.setAttribute("switch",""),t.tabIndex=-1;let i=s=>s.stopPropagation();for(let s of[e,t])s.addEventListener("click",i),s.addEventListener("change",i),s.addEventListener("input",i);e.appendChild(t),n.body.appendChild(e),Ku=e}Ku.click()}}var Bg=!1;function pS(){if(!Bg){Bg=!0;try{fr.navigator?.storage?.persist?.().catch(()=>{})}catch{}}}var ol=uS({handler:zg,storage:hS,now:()=>{try{return fr.performance?fr.performance.now():Date.now()}catch{return Date.now()}},webHaptic:dS()?fS:null}),dI=zg()!==null;function Or(n){ol.haptic(n)}async function Hg(n,e){return ol.storeSave(n,e)}async function Ju(n){return ol.loadSave(n)}function Gg(){return ol.loadSettings()}function Vg(n){ol.saveSettings(n)}function Wg(){let n=[pn("applied",e=>{e.tool!=="inspect"&&Or(e.tool.startsWith("build:")||e.tool==="bulldoze"?"medium":"light")}),pn("denied",()=>Or("warning")),pn("milestone",()=>Or("success")),pn("undo",()=>Or("light"))];return()=>n.forEach(e=>e())}var Xg=["police","fire","health","education","parks"];var nt={power_coal:{type:"power_coal",name:"Coal Power Plant",blurb:"Lots of power, lots of smoke.",size:3,cost:4e3,upkeep:160,unlockPop:0,needsRoad:!0,needsPower:!1,power:{capacity:600,radius:16},pollution:{amount:200,radius:7}},power_wind:{type:"power_wind",name:"Wind Turbine",blurb:"Clean power for a small area.",size:1,cost:800,upkeep:20,unlockPop:400,needsRoad:!1,needsPower:!1,power:{capacity:60,radius:7}},power_solar:{type:"power_solar",name:"Solar Farm",blurb:"Clean power with a wide reach.",size:2,cost:6e3,upkeep:90,unlockPop:2500,needsRoad:!0,needsPower:!1,power:{capacity:400,radius:13}},water_tower:{type:"water_tower",name:"Water Tower",blurb:"Water for the blocks around it.",size:1,cost:600,upkeep:30,unlockPop:0,needsRoad:!0,needsPower:!0,water:{capacity:150,radius:9}},water_pump:{type:"water_pump",name:"Water Pump",blurb:"Big water supply. Must touch a lake or river.",size:2,cost:3e3,upkeep:120,unlockPop:400,needsRoad:!0,needsPower:!0,needsWaterEdge:!0,water:{capacity:700,radius:15}},park_small:{type:"park_small",name:"Small Park",blurb:"Trees and a bench. Neighbours love it.",size:1,cost:150,upkeep:5,unlockPop:0,needsRoad:!1,needsPower:!1,service:{kind:"parks",radius:4},landValue:{amount:30,radius:4}},park_plaza:{type:"park_plaza",name:"Town Plaza",blurb:"A fountain square that lifts the whole area.",size:2,cost:1500,upkeep:25,unlockPop:1e3,needsRoad:!0,needsPower:!1,service:{kind:"parks",radius:8},landValue:{amount:50,radius:8},happiness:2},police:{type:"police",name:"Police Station",blurb:"Keeps the streets around it safe.",size:2,cost:1800,upkeep:40,unlockPop:150,needsRoad:!0,needsPower:!0,service:{kind:"police",radius:12}},fire:{type:"fire",name:"Fire Station",blurb:"Fire cover for the blocks around it.",size:2,cost:1800,upkeep:40,unlockPop:150,needsRoad:!0,needsPower:!0,service:{kind:"fire",radius:12}},clinic:{type:"clinic",name:"Clinic",blurb:"Healthcare for a neighbourhood.",size:2,cost:2500,upkeep:50,unlockPop:400,needsRoad:!0,needsPower:!0,service:{kind:"health",radius:11}},school:{type:"school",name:"School",blurb:"Education makes better neighbourhoods.",size:2,cost:2500,upkeep:50,unlockPop:400,needsRoad:!0,needsPower:!0,service:{kind:"education",radius:11}},hospital:{type:"hospital",name:"Hospital",blurb:"Healthcare for half the city.",size:3,cost:7e3,upkeep:180,unlockPop:2500,needsRoad:!0,needsPower:!0,service:{kind:"health",radius:20}},college:{type:"college",name:"College",blurb:"Education for half the city.",size:3,cost:8e3,upkeep:190,unlockPop:2500,needsRoad:!0,needsPower:!0,service:{kind:"education",radius:20}},stadium:{type:"stadium",name:"Stadium",blurb:"Game nights make the whole city happier.",size:4,cost:15e3,upkeep:300,unlockPop:6e3,needsRoad:!0,needsPower:!0,landValue:{amount:40,radius:12},happiness:8},landmark:{type:"landmark",name:"Sky Tower",blurb:"A landmark everyone wants to live near.",size:2,cost:25e3,upkeep:100,unlockPop:12e3,needsRoad:!0,needsPower:!0,landValue:{amount:80,radius:16},happiness:5}},ju=Object.keys(nt),Yg=[{id:"roads",label:"Roads",tools:["road"]},{id:"zones",label:"Zones",tools:["zone_res","zone_com","zone_ind"]},{id:"utilities",label:"Utilities",tools:["build:power_coal","build:power_wind","build:power_solar","build:water_tower","build:water_pump"]},{id:"services",label:"Services",tools:["build:police","build:fire","build:clinic","build:school","build:hospital","build:college"]},{id:"fun",label:"Parks",tools:["build:park_small","build:park_plaza","build:stadium","build:landmark"]},{id:"bulldoze",label:"Bulldoze",tools:["bulldoze"]}],mS={inspect:{name:"Look",blurb:"Tap anything to see how it is doing.",cost:0,perTile:!1,unlockPop:0},road:{name:"Road",blurb:"Drag to lay road. Zones need a road within 3 tiles.",cost:10,perTile:!0,unlockPop:0},zone_res:{name:"Homes",blurb:"Drag to zone housing (green).",cost:5,perTile:!0,unlockPop:0},zone_com:{name:"Shops",blurb:"Drag to zone shops and offices (blue).",cost:5,perTile:!0,unlockPop:0},zone_ind:{name:"Industry",blurb:"Drag to zone factories (yellow). They pollute.",cost:5,perTile:!0,unlockPop:0},bulldoze:{name:"Bulldoze",blurb:"Drag over anything to clear it.",cost:0,perTile:!0,unlockPop:0}};function Fr(n){if(n.startsWith("build:")){let e=nt[n.slice(6)];return{name:e.name,blurb:e.blurb,cost:e.cost,perTile:!1,unlockPop:e.unlockPop}}return mS[n]}function pr(n){return n.startsWith("build:")?n.slice(6):null}var Tt={res:"#4cc764",com:"#3d8bff",ind:"#f2b632"};var at=32,As=16,Wo=at+As*2,Vo=8,qg=4,al=Vo*Wo,Qu=qg*Wo,eh=0,Of=4,Ff=5,Bf=6,ll=9,zf=12,Hf=13,Gf=14,Vf=15,Wf=16,$g=5,gS=27,cl=5.5/at,Vi=(at/2-$g/2)/at;function Qt(n){let e=parseInt(n.slice(1),16);return[e>>16&255,e>>8&255,e&255]}function Uf(n,e,t){return[n[0]+(e[0]-n[0])*t,n[1]+(e[1]-n[1])*t,n[2]+(e[2]-n[2])*t]}function Xt(n,e){return[n[0]*e,n[1]*e,n[2]*e]}var Zg={grass:Qt("#86bd5e"),grassLight:Qt("#93c76a"),grassDark:Qt("#74ab50"),sand:Qt("#efdca3"),sandDark:Qt("#d9c088"),bed:Qt("#5aa6a0"),asphalt:Qt("#4d5361"),sidewalk:Qt("#d8d2c4"),curb:Qt("#b2ac9f"),marking:Qt("#f4f0e4"),kerb:Qt("#e9e4d6"),pavers:Qt("#dcd5c6"),concrete:Qt("#b7b5ad"),hazard:Qt("#f0c040"),plaza:Qt("#e6dcc6"),gravel:Qt("#bdb6a6"),park:Qt("#7fc25c"),path:Qt("#e2d6bb")};function Kg(){let n=document.createElement("canvas");n.width=al,n.height=Qu;let e=n.getContext("2d"),t=e.createImageData(al,Qu),i=t.data,s=(u,d)=>{let h=u%Vo*Wo+As,f=Math.floor(u/Vo)*Wo+As;for(let p=-As;p<at+As;p++)for(let x=-As;x<at+As;x++){let g=Math.min(at-1,Math.max(0,x)),m=Math.min(at-1,Math.max(0,p)),b=d(g,m),w=((f+p)*al+(h+x))*4;i[w]=Math.max(0,Math.min(255,Math.round(b[0]))),i[w+1]=Math.max(0,Math.min(255,Math.round(b[1]))),i[w+2]=Math.max(0,Math.min(255,Math.round(b[2]))),i[w+3]=255}},r=u=>{let d=new Array(at*at);return(h,f)=>d[f*at+h]??(d[f*at+h]=u(h,f))},o=Zg;for(let u=0;u<4;u++)s(eh+u,r((d,h)=>{let f=ve(d,h,11+u),p=Xt(o.grass,.97+f*.06),x=ve(d*3+1,h*7+2,40+u);if(x>.93?p=o.grassLight:x<.05&&(p=o.grassDark),ve(d,h-1,77+u)>.975&&(p=o.grassDark),u===3){let g=ve(d,h,999);g>.992?p=Qt("#fff6e0"):g>.987?p=Qt("#ffd65a"):g>.983&&(p=Qt("#ff9fb8"))}return p}));s(Of,r((u,d)=>{let h=ve(u,d,5),f=Xt(o.sand,.96+h*.07);return ve(u*5,d*3,6)>.96&&(f=o.sandDark),f})),s(Ff,r((u,d)=>{let h=ve(u,d,9),f=Xt(o.bed,.92+h*.14);return ve(u*3,d*5,10)>.95&&(f=Xt(o.bed,1.18)),f}));let a=[Tt.res,Tt.com,Tt.ind];for(let u=0;u<3;u++){let d=Qt(a[u]),h=Uf(Uf(o.grass,d,.4),[255,255,255],.22);s(Bf+u,r((f,p)=>{let x=Math.min(f,p,at-1-f,at-1-p);if(x===0)return o.kerb;if(x===2&&(f===2||f===at-3?p:f)%5<3)return Xt(d,.95);let g=Xt(h,.98+ve(f,p,30+u)*.04);return(f+p)%7===0&&(g=Xt(g,.94)),g}))}s(ll+0,r((u,d)=>{if(Math.min(u,d,at-1-u,at-1-d)===0)return o.kerb;if(u>=14&&u<=17&&d>=22)return Xt(o.path,.95+ve(u,d,3)*.08);let f=Xt(Uf(o.grass,o.grassLight,.45),.97+ve(u,d,41)*.05);return ve(u*7,d*3,42)>.95&&(f=o.grassDark),f})),s(ll+1,r((u,d)=>{if(Math.min(u,d,at-1-u,at-1-d)===0)return Xt(o.pavers,.86);if(u%4===0||d%4===0)return Xt(o.pavers,.91);let f=ve(Math.floor(u/4),Math.floor(d/4),50);return Xt(o.pavers,.97+f*.06)})),s(ll+2,r((u,d)=>{if(Math.min(u,d,at-1-u,at-1-d)===0)return Xt(o.concrete,.82);if(d>=26&&d<=28&&u>=3&&u<=28)return(u+d)%4<2?o.hazard:Xt(o.asphalt,1.2);let f=Xt(o.concrete,.95+ve(u,d,60)*.08),p=Math.hypot(u-9,d-10),x=Math.hypot(u-23,d-17);return(p<3.5||x<2.5)&&(f=Xt(f,.88)),u%8===0&&d<24&&(f=Xt(f,.93)),f})),s(zf,r((u,d)=>{let h=Math.floor(d/4),f=h%2===0?0:4;return d%4===0||(u+f)%8===0?Xt(o.plaza,.9):Xt(o.plaza,.97+ve(Math.floor((u+f)/8),h,70)*.06)})),s(Hf,r((u,d)=>{let h=ve(u,d,80);return Xt(o.gravel,.84+h*.28)})),s(Gf,r((u,d)=>{let h=ve(u,d,90),f=Xt(o.park,.97+h*.06);return ve(u*3,d*5,91)>.95&&(f=o.grassLight),f})),s(Vf,()=>[255,255,255]);for(let u=0;u<16;u++)s(Wf+u,xS(u));e.putImageData(t,0,0);let l=new Ui(n);l.colorSpace=Wt,l.flipY=!1,l.magFilter=Kt,l.minFilter=Mi,l.generateMipmaps=!0,l.wrapS=l.wrapT=Kn,l.needsUpdate=!0;let c=[];for(let u=0;u<Vo*qg;u++){let d=u%Vo*Wo+As,h=Math.floor(u/Vo)*Wo+As;c.push([d/al,h/Qu,(d+at)/al,(h+at)/Qu])}return{texture:l,rect:u=>c[u]}}function xS(n){let e=$g,t=gS,i=(t-e)/2,s=(n&1)!==0,r=(n&2)!==0,o=(n&4)!==0,a=(n&8)!==0,l=+s+ +r+ +o+ +a,c=n===5||n===10,u=l===2&&!c,d=new Uint8Array(at*at);for(let f=0;f<at;f++)for(let p=0;p<at;p++){let x=p+.5,g=f+.5,m=x-16,b=g-16,w=!1,y=!1;if(u){let _=r?at:0,M=s?0:at,A=Math.hypot(x-_,g-M);if(w=A>=e&&A<=t,w&&Math.abs(A-16)<1){let v=Math.atan2(Math.abs(g-M),Math.abs(x-_));y=Math.floor(v*16/4)%2===0}}else if(l===0){let _=Math.max(Math.abs(m)-4,0),M=Math.max(Math.abs(b)-4,0);w=Math.hypot(_,M)<=6.5}else if(l===1){let _=s?0:r?1:o?2:3,M=_===0||_===2?m:b,A=_===0?g:_===1?at-x:_===2?at-g:x;w=Math.abs(M)<=i&&A<=16||Math.hypot(m,b)<=i+.5,Math.abs(M)<1&&A<11&&Math.floor(A/4)%2===0&&(y=!0)}else{let _=Math.abs(m)<=i&&Math.abs(b)<=i,M=s&&Math.abs(m)<=i&&b<0,A=o&&Math.abs(m)<=i&&b>0,v=r&&Math.abs(b)<=i&&m>0,S=a&&Math.abs(b)<=i&&m<0;if(w=_||M||A||v||S,!w){let C=[[s&&r,at,0],[r&&o,at,at],[o&&a,0,at],[a&&s,0,0]];for(let[P,D,N]of C){let I=Math.abs(x-D)<=e&&Math.abs(g-N)<=e;P&&I&&Math.hypot(x-D,g-N)>e+1.2&&(w=!0)}}if(c){let C=n===5?g:x;Math.abs(n===5?m:b)<1&&Math.floor(C/4)%2===0&&(y=!0)}else{let C=P=>P>e+1&&P<t-1&&Math.floor((P-e-1)/2)%2===0;M&&g<e&&g>.5&&C(x)&&(y=!0),A&&g>t&&g<at-.5&&C(x)&&(y=!0),v&&x>t&&x<at-.5&&C(g)&&(y=!0),S&&x<e&&x>.5&&C(g)&&(y=!0)}}d[f*at+p]=w?y?2:1:0}let h=Zg;return(f,p)=>{let x=d[p*at+f];if(x===2)return Xt(h.marking,.97+ve(f,p,3)*.04);if(x===1)return Xt(h.asphalt,.95+ve(f,p,100+n)*.09);let g=(m,b)=>m>=0&&b>=0&&m<at&&b<at&&d[b*at+m]!==0;return g(f-1,p)||g(f+1,p)||g(f,p-1)||g(f,p+1)?h.curb:f%6===0||p%6===0?Xt(h.sidewalk,.95):Xt(h.sidewalk,.98+ve(f,p,7)*.04)}}var ul=-.12,mr=-.42,Br=-2.6,ni=[0,1,0,-1],ii=[-1,0,1,0],Xf=[2,3,0,1],th=[0,1,0,-1],nh=[1,0,-1,0];function Cs(n,e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);n[e]=l*o,n[e+1]=0,n[e+2]=-c*o,n[e+3]=0,n[e+4]=0,n[e+5]=a,n[e+6]=0,n[e+7]=0,n[e+8]=c*o,n[e+9]=0,n[e+10]=l*o,n[e+11]=0,n[e+12]=t,n[e+13]=i,n[e+14]=s,n[e+15]=1}function Jg(n,e,t,i,s,r,o,a,l){let c=Math.cos(r),u=Math.sin(r);n[e]=c*o,n[e+1]=0,n[e+2]=-u*o,n[e+3]=0,n[e+4]=0,n[e+5]=a,n[e+6]=0,n[e+7]=0,n[e+8]=u*l,n[e+9]=0,n[e+10]=c*l,n[e+11]=0,n[e+12]=t,n[e+13]=i,n[e+14]=s,n[e+15]=1}function sn(n,e=[0,0,0]){let t=new Re(n);return e[0]=t.r,e[1]=t.g,e[2]=t.b,e}function zr(n,e,t){return n<e?e:n>t?t:n}function ih(n,e,t){let i=zr((t-n)/(e-n),0,1);return i*i*(3-2*i)}var Rs=class{constructor(){this.pos=[];this.nor=[];this.uv=[];this.col=[];this.glow=[];this.idx=[];this.n=0}get vertexCount(){return this.n}quad(e,t,i,s,r,o,a,l,c,u,d,h,f,p,x,g,m,b,w,y=0){let _=this.n;this.pos.push(e,t,i,s,r,o,a,l,c,u,d,h);for(let U=0;U<4;U++)this.nor.push(f,p,x),this.col.push(g,m,b),this.glow.push(y);if(w)for(let U=0;U<8;U++)this.uv.push(w[U]);else this.uv.push(0,0,0,0,0,0,0,0);let M=s-e,A=r-t,v=o-i,S=a-e,C=l-t,P=c-i,D=A*P-v*C,N=v*S-M*P,I=M*C-A*S;D*f+N*p+I*x>=0?this.idx.push(_,_+1,_+2,_,_+2,_+3):this.idx.push(_,_+2,_+1,_,_+3,_+2),this.n+=4}box(e,t,i,s,r,o,a,l,c,u=0,d=!1){this.quad(e,r,i,s,r,i,s,r,o,e,r,o,0,1,0,a,l,c,void 0,u);let h=.92;this.quad(e,t,o,s,t,o,s,r,o,e,r,o,0,0,1,a*h,l*h,c*h,void 0,u),this.quad(e,t,i,s,t,i,s,r,i,e,r,i,0,0,-1,a*h,l*h,c*h,void 0,u),this.quad(s,t,i,s,t,o,s,r,o,s,r,i,1,0,0,a*h,l*h,c*h,void 0,u),this.quad(e,t,i,e,t,o,e,r,o,e,r,i,-1,0,0,a*h,l*h,c*h,void 0,u),d&&this.quad(e,t,i,s,t,i,s,t,o,e,t,o,0,-1,0,a*.7,l*.7,c*.7,void 0,u)}build(e=!0,t=!1){let i=new zt;i.setAttribute("position",new kt(this.pos,3)),i.setAttribute("normal",new kt(this.nor,3)),i.setAttribute("color",new kt(this.col,3)),e&&i.setAttribute("uv",new kt(this.uv,2)),t&&i.setAttribute("aGlow",new kt(this.glow,1));let s=this.n;return i.setIndex(s>65535?new Ks(this.idx,1):new Zs(this.idx,1)),i.computeBoundingSphere(),i.computeBoundingBox(),i}};function hl(n,e,t,i,s,r,o,a,l,c=0){let u=[],d=Math.max(.001,s),h=Math.max(3,Math.min(16,Math.ceil(d*3))),f=[[t,i,0],[n,i,Math.PI/2],[n,e,Math.PI],[t,e,Math.PI*1.5]];for(let[y,_,M]of f)for(let A=0;A<=h;A++){let v=M+A/h*(Math.PI/2);u.push(y+Math.cos(v)*d,_+Math.sin(v)*d,Math.cos(v),Math.sin(v))}let p=u.length/4,x=a.pos.length/3,[g,m,b,w]=l;for(let y=0;y<p;y++){let _=u[y*4],M=u[y*4+1],A=u[y*4+2],v=u[y*4+3];a.pos.push(_,o,M,_+A*r,o,M+v*r),a.col.push(g,m,b,w,g,m,b,w*.55)}for(let y=0;y<p;y++){let _=x+y*2,M=x+(y+1)%p*2;a.idx.push(_,M,_+1,M,M+1,_+1)}if(c>0){let y=a.pos.length/3;a.pos.push((n+t)/2,o,(e+i)/2),a.col.push(g,m,b,c);for(let _=0;_<p;_++)a.pos.push(u[_*4],o,u[_*4+1]),a.col.push(g,m,b,c);for(let _=0;_<p;_++)a.idx.push(y,y+1+(_+1)%p,y+1+_)}}function dl(n){let e=new zt;return e.setAttribute("position",new kt(n.pos,3)),e.setAttribute("color",new kt(n.col,4)),e.setIndex(n.pos.length/3>65535?new Ks(n.idx,1):new Zs(n.idx,1)),e.computeBoundingSphere(),e}var sh=class{constructor(){this.mat=new Qn({vertexColors:!0,emissive:new Re("#5a6474"),transparent:!0,opacity:.82,depthWrite:!1}),this.mesh=new St(new zt,this.mat),this.mesh.name="clouds",this.mesh.renderOrder=-10,this.mesh.castShadow=!1,this.mesh.receiveShadow=!1}build(e){let t=kn(e*31+7),i=new Rs,s=16;for(let r=0;r<s;r++){let o=r/s*Math.PI*2+t()*.3,a=e*(.45+t()*.75),l=Math.cos(o)*a,c=Math.sin(o)*a,u=-8-t()*10,d=.9+t()*1.3,h=5+(t()*4|0);for(let f=0;f<h;f++){let p=d*(1.2+t()*1.6),x=d*(1+t()*1.2),g=d*(.5+t()*.6),m=(t()-.5)*d*3.2,b=(t()-.5)*d*2.2,w=t()*d*.5,y=.93+t()*.07;i.box(l+m-p/2,u+w,c+b-x/2,l+m+p/2,u+w+g,c+b+x/2,y,y,y,0,!0)}}this.mesh.geometry.dispose(),this.mesh.geometry=i.build(!1,!1),this.mesh.position.set(e/2,0,e/2)}update(e){this.mesh.rotation.y+=e*.006}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}};var yn=360,jg=.42,fl=72,bS=new Re("#eeeeec"),yS=new Re("#c9c9cc"),vS=new Re("#dcc6a0"),rh=class{constructor(){this.px=new Float32Array(yn);this.py=new Float32Array(yn);this.pz=new Float32Array(yn);this.vx=new Float32Array(yn);this.vy=new Float32Array(yn);this.vz=new Float32Array(yn);this.age=new Float32Array(yn);this.life=new Float32Array(yn);this.size=new Float32Array(yn);this.spin=new Float32Array(yn);this.kind=new Uint8Array(yn);this.cr=new Float32Array(yn);this.cg=new Float32Array(yn);this.cb=new Float32Array(yn);this.alive=0;this.emitClock=new Float32Array(fl);this.seed=1;this.density=1;let e=new Qs(1,1,1),t=new Qn({color:16777215});this.mesh=new jn(e,t,yn),this.mesh.instanceMatrix.setUsage(Si),this.mesh.instanceColor=new cn(new Float32Array(yn*3),3),this.mesh.instanceColor.setUsage(Si),this.mesh.count=0,this.mesh.frustumCulled=!1,this.mesh.castShadow=!1,this.mesh.receiveShadow=!1,this.mesh.name="fx";for(let i=0;i<fl;i++)this.emitClock[i]=this.rand()*jg}rand(){return this.seed=this.seed*1664525+1013904223>>>0,this.seed/4294967296}spawn(e,t,i,s,r,o,a,l,c,u){let d;this.alive<yn?d=this.alive++:d=this.rand()*yn|0,this.px[d]=e,this.py[d]=t,this.pz[d]=i,this.vx[d]=s,this.vy[d]=r,this.vz[d]=o,this.age[d]=0,this.life[d]=a,this.size[d]=l,this.spin[d]=this.rand()*6.28,this.kind[d]=c,this.cr[d]=u.r,this.cg[d]=u.g,this.cb[d]=u.b}dust(e,t,i,s){let r=e+i/2,o=t+s/2,a=Math.min(26,8+Math.round((i+s)*3));for(let l=0;l<a;l++){let c=l/a*Math.PI*2+this.rand()*.4,u=Math.cos(c),d=Math.sin(c),h=i/2*u*.95,f=s/2*d*.95,p=.5+this.rand()*.6;this.spawn(r+h,.05,o+f,u*p,.35+this.rand()*.4,d*p,.55+this.rand()*.35,.1+this.rand()*.09*Math.min(2,i),1,vS)}}clear(){this.alive=0,this.mesh.count=0}update(e,t,i,s){let r=Math.min(fl,i),o=i>fl?i/fl:1,a=jg/Math.max(.2,this.density);for(let h=0;h<r;h++){if(this.emitClock[h]-=e,this.emitClock[h]>0)continue;this.emitClock[h]+=a*(.8+this.rand()*.4);let f=Math.floor(h*o)*3,p=this.rand()<.5?bS:yS;this.spawn(t[f]+(this.rand()-.5)*.05,t[f+1],t[f+2]+(this.rand()-.5)*.05,.06+this.rand()*.06,.45+this.rand()*.2,.03*(this.rand()-.5),2.2+this.rand()*.8,.11+this.rand()*.05,0,p)}let l=this.mesh.instanceMatrix.array,c=this.mesh.instanceColor.array,u=1-s*.55,d=0;for(;d<this.alive;){if(this.age[d]+=e,this.age[d]>=this.life[d]){let g=--this.alive;d!==g&&this.move(g,d);continue}let h=this.age[d]/this.life[d];if(this.kind[d]===0)this.vy[d]*=1-e*.25;else{let g=1-Math.min(1,e*3.5);this.vx[d]*=g,this.vz[d]*=g,this.vy[d]-=e*.9}this.px[d]+=this.vx[d]*e,this.py[d]+=this.vy[d]*e,this.pz[d]+=this.vz[d]*e,this.py[d]<.02&&(this.py[d]=.02);let f=this.kind[d]===0?1+h*1.6:1+h*.8,p=h<.75?1:1-(h-.75)/.25,x=this.size[d]*f*Math.max(.05,p)*Math.min(1,h*8+.3);Cs(l,d*16,this.px[d],this.py[d],this.pz[d],this.spin[d]+h*1.5,x,x),c[d*3]=this.cr[d]*u,c[d*3+1]=this.cg[d]*u,c[d*3+2]=this.cb[d]*u,d++}this.mesh.count=this.alive,this.mesh.visible=this.alive>0,this.alive>0&&(this.mesh.instanceMatrix.needsUpdate=!0,this.mesh.instanceColor.needsUpdate=!0)}move(e,t){this.px[t]=this.px[e],this.py[t]=this.py[e],this.pz[t]=this.pz[e],this.vx[t]=this.vx[e],this.vy[t]=this.vy[e],this.vz[t]=this.vz[e],this.age[t]=this.age[e],this.life[t]=this.life[e],this.size[t]=this.size[e],this.spin[t]=this.spin[e],this.kind[t]=this.kind[e],this.cr[t]=this.cr[e],this.cg[t]=this.cg[e],this.cb[t]=this.cb[e]}dispose(){this.mesh.geometry.dispose(),this.mesh.material.dispose(),this.mesh.dispose()}};function Qg(){return{uNight:{value:0},uGlass:{value:new Re("#33496a")},uGlowBoost:{value:1.25}}}function Yf(n,e){n.onBeforeCompile=t=>{t.uniforms.uNight=e.uNight,t.uniforms.uGlass=e.uGlass,t.uniforms.uGlowBoost=e.uGlowBoost,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
attribute float aGlow;
varying float vGlow;
varying float vLit;
uniform float uNight;`).replace("#include <color_vertex>",`#include <color_vertex>
vGlow = aGlow;
float glowTh = 0.18;
float glowLvl = 1.0;
#ifdef USE_INSTANCING
  vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
  float gh = fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453);
  glowTh = 0.05 + gh * 0.5;
  glowLvl = 0.7 + 0.3 * fract(gh * 7.31);
#endif
vLit = smoothstep(glowTh, glowTh + 0.15, uNight) * glowLvl;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying float vGlow;
varying float vLit;
uniform vec3 uGlass;
uniform float uGlowBoost;`).replace("#include <color_fragment>",`#include <color_fragment>
vec3 glowLitCol = diffuseColor.rgb;
diffuseColor.rgb = mix(diffuseColor.rgb, mix(uGlass, glowLitCol * 0.2, vLit), vGlow);`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += glowLitCol * (vGlow * vLit * uGlowBoost);`)},n.customProgramCacheKey=()=>"cubopolis-glow"}function ex(n){let e=new Qn({vertexColors:!0});return Yf(e,n),e}function tx(){return{uTime:{value:0},uMask:{value:null},uSize:{value:64},uDeep:{value:new Re("#2e86d4")},uShallow:{value:new Re("#5fd0e6")},uFoam:{value:new Re("#effcff")},uNight:{value:0}}}function nx(n){let e=new Ea({color:16777215,specular:new Re("#3c4652"),shininess:140,transparent:!0});return e.onBeforeCompile=t=>{Object.assign(t.uniforms,n),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWPos;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vWPos;
uniform float uTime;
uniform sampler2D uMask;
uniform float uSize;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform float uNight;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(41.31, 289.17))) * 15731.743); }
float wWave(vec2 q, float t) {
  return sin(q.x * 2.9 + t * 1.25) * sin(q.y * 2.3 - t * 1.05)
       + 0.55 * sin((q.x + q.y) * 4.7 + t * 1.9)
       + 0.35 * sin((q.x - q.y) * 7.3 - t * 2.4);
}`).replace("#include <color_fragment>",`#include <color_fragment>
vec2 wq = (floor(vWPos.xz * 16.0) + 0.5) / 16.0;
float landM = texture2D(uMask, wq / uSize).r;
float wv = wWave(wq, uTime);
float shallowK = smoothstep(0.04, 0.42, landM);
vec3 wcol = mix(uDeep, uShallow, shallowK);
wcol *= 0.93 + 0.07 * wv;
// little sparkles that blink in and out
float sp = wHash(floor(wq * 16.0));
float blink = fract(sp * 13.7 + uTime * 0.35);
wcol += vec3(0.16) * step(0.975, sp) * smoothstep(0.0, 0.15, blink) * smoothstep(0.45, 0.15, blink) * (1.0 - uNight * 0.6);
// foam band along the shore, breathing slowly
float foamEdge = landM + 0.05 * sin(uTime * 1.6 + wq.x * 5.0 + wq.y * 4.0);
float foam = smoothstep(0.30, 0.40, foamEdge);
wcol = mix(wcol, uFoam, foam * 0.9);
diffuseColor.rgb = wcol;
diffuseColor.a = mix(0.9, 0.72, shallowK);
diffuseColor.a = mix(diffuseColor.a, 0.95, foam);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
{
  float e = 1.0 / 16.0;
  float hx = wWave(wq + vec2(e, 0.0), uTime) - wv;
  float hz = wWave(wq + vec2(0.0, e), uTime) - wv;
  vec3 wn = normalize(vec3(-hx * 0.28, 1.0, -hz * 0.28));
  normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
}`)},e.customProgramCacheKey=()=>"cubopolis-water",e}function ix(n,e,t){return e<0||t<0||e>=n.size||t>=n.size?!1:n.tiles.kind[t*n.size+e]===1}function gr(n,e,t){let i=0;for(let s=0;s<4;s++)ix(n,e+ni[s],t+ii[s])&&(i|=1<<s);return i}function Xo(n,e){return n.tiles.terrain[e]===1&&n.tiles.kind[e]===0}function oh(n,e,t){for(let i=1;i<=pi;i++)for(let s=0;s<4;s++)if(ix(n,e+th[s]*i,t+nh[s]*i))return s;return n.tiles.variant[t*n.size+e]&3}function sx(n){if(n==="park_small")return"park";let e=nt[n];return e.power||e.water?"gravel":"plaza"}var mi=32,wn={lipGrass:sn("#5fae3e"),lipSand:sn("#dcc287"),dirt:sn("#a06f43"),dirtDark:sn("#875c38"),dirtLight:sn("#b38252"),stone:sn("#a3a3aa"),stoneDark:sn("#8a8b94"),quay:sn("#a9a69d"),sandWall:sn("#cdb27a"),waterSide:sn("#4fb3e0"),waterSideDeep:sn("#2f7fc0"),bottom:sn("#4e4a52")},ah=class{constructor(e,t){this.atlas=e;this.waterU=t;this.group=new un;this.chunks=[];this.chunksPerSide=0;this.dirtyChunks=new Set;this.slab=null;this.slabDirty=!0;this.water=null;this.maskTex=null;this.maskDirty=!0;this.hasWater=!1;this.state=null;this.groundMat=new Qn({map:e.texture,vertexColors:!0}),this.slabMat=new Qn({vertexColors:!0}),this.waterMat=nx(t),this.group.name="ground"}setState(e){this.state=e;for(let i of this.chunks)i&&this.disposeMesh(i);this.chunks=[],this.dirtyChunks.clear(),this.chunksPerSide=Math.ceil(e.size/mi);let t=this.chunksPerSide*this.chunksPerSide;for(let i=0;i<t;i++)this.chunks.push(null),this.dirtyChunks.add(i);this.slab&&this.disposeMesh(this.slab),this.slab=null,this.slabDirty=!0,this.water&&this.disposeMesh(this.water),this.water=null,this.maskTex?.dispose(),this.maskTex=null,this.maskDirty=!0}markTile(e){let t=this.state;if(!t)return;let i=e%t.size,s=e/t.size|0;this.markChunkAt(i,s),i%mi===0&&this.markChunkAt(i-1,s),i%mi===mi-1&&this.markChunkAt(i+1,s),s%mi===0&&this.markChunkAt(i,s-1),s%mi===mi-1&&this.markChunkAt(i,s+1),(i===0||s===0||i===t.size-1||s===t.size-1)&&(this.slabDirty=!0),this.maskDirty=!0}markChunkAt(e,t){let i=this.state;!i||e<0||t<0||e>=i.size||t>=i.size||this.dirtyChunks.add((t/mi|0)*this.chunksPerSide+(e/mi|0))}update(){let e=this.state;if(e){if(this.dirtyChunks.size){for(let t of this.dirtyChunks)this.buildChunk(e,t);this.dirtyChunks.clear()}this.maskDirty&&(this.buildMask(e),this.maskDirty=!1),this.slabDirty&&(this.buildSlab(e),this.slabDirty=!1),this.water||this.buildWater(e)}}setShadows(e){for(let t of this.chunks)t&&(t.receiveShadow=e);this.slab&&(this.slab.receiveShadow=e),this.water&&(this.water.receiveShadow=e)}dispose(){for(let e of this.chunks)e&&this.disposeMesh(e);this.slab&&this.disposeMesh(this.slab),this.water&&this.disposeMesh(this.water),this.maskTex?.dispose(),this.groundMat.dispose(),this.slabMat.dispose(),this.waterMat.dispose()}disposeMesh(e){this.group.remove(e),e.geometry.dispose()}buildChunk(e,t){let i=this.chunksPerSide,s=t%i*mi,r=(t/i|0)*mi,o=Math.min(e.size,s+mi),a=Math.min(e.size,r+mi),l=new Rs,c=e.tiles,u=new Float32Array(8),d=this.atlas.rect(Vf),h=(d[0]+d[2])/2,f=(d[1]+d[3])/2,p=[h,f,h,f,h,f,h,f];for(let b=r;b<a;b++)for(let w=s;w<o;w++){let y=b*e.size+w,_=c.kind[y],M=c.terrain[y],A=M===1&&_===0,v=eh,S=0,C=1,P=1,D=1;if(_===1)v=Wf+gr(e,w,b),C=P=D=.97+ve(w,b,3)*.05;else if(_===2&&c.zone[y]>=1&&c.zone[y]<=3)v=(c.level[y]>0?ll:Bf)+c.zone[y]-1,S=oh(e,w,b);else if(_===3){let I=c.bld[y]>=0?e.buildings[c.bld[y]]:null,U=I?sx(I.type):"plaza";v=U==="park"?Gf:U==="gravel"?Hf:zf}else if(A)v=Ff,S=ve(w,b,8)*4|0;else if(M===2)v=Of,S=ve(w,b,9)*4|0,C=P=D=.97+ve(w,b,4)*.06;else{v=eh+(ve(w,b,1)*4|0),S=ve(w,b,2)*4|0;let I=ve(w,b,5)-.5,U=ve(w,b,6)-.5;C=1+I*.12+U*.08,P=1+I*.1,D=1+I*.08-U*.1,c.trees[y]>0&&(C*=.9,P*=.93,D*=.9)}let N=A?mr:0;if(this.cellUV(v,S,u),l.quad(w,N,b,w+1,N,b,w+1,N,b+1,w,N,b+1,0,1,0,C,P,D,u),!A)for(let I=0;I<4;I++){let U=w+ni[I],W=b+ii[I];U<0||W<0||U>=e.size||W>=e.size||Xo(e,W*e.size+U)&&this.bank(l,w,b,I,M,_,p)}}let x=l.build(!0,!1),g=this.chunks[t];g&&this.disposeMesh(g);let m=new St(x,this.groundMat);m.receiveShadow=!0,m.castShadow=!1,m.matrixAutoUpdate=!1,m.name=`ground-chunk-${t}`,this.chunks[t]=m,this.group.add(m)}bank(e,t,i,s,r,o,a){let l,c,u,d;s===0?(l=t,c=i,u=t+1,d=i):s===1?(l=t+1,c=i,u=t+1,d=i+1):s===2?(l=t+1,c=i+1,u=t,d=i+1):(l=t,c=i+1,u=t,d=i);let h=ni[s],f=ii[s],p=r===1&&o!==0,x=r===2,g=p?wn.quay:x?wn.lipSand:wn.lipGrass,m=p?wn.quay:x?wn.sandWall:wn.dirt,b=p?-.04:-.07;e.quad(l,0,c,u,0,d,u,b,d,l,b,c,h,0,f,g[0],g[1],g[2],a);let w=.92+ve(t*4+s,i,12)*.12;e.quad(l,b,c,u,b,d,u,mr,d,l,mr,c,h,0,f,m[0]*w,m[1]*w,m[2]*w,a)}cellUV(e,t,i){let[s,r,o,a]=this.atlas.rect(e),l=o-s,c=a-r,u=[-.5,.5,.5,-.5],d=[-.5,-.5,.5,.5];for(let h=0;h<4;h++){let f=u[h],p=d[h];for(let x=0;x<t;x++){let g=-p;p=f,f=g}i[h*2]=s+(f+.5)*l,i[h*2+1]=r+(p+.5)*c}}buildMask(e){let t=e.size;if(!this.maskTex||this.maskTex.image.width!==t){this.maskTex?.dispose();let r=new Uint8Array(t*t*4),o=new ws(r,t,t,Ln);o.magFilter=qt,o.minFilter=qt,o.wrapS=o.wrapT=Kn,o.generateMipmaps=!1,o.flipY=!1,this.maskTex=o,this.waterU.uMask.value=o,this.waterU.uSize.value=t}let i=this.maskTex.image.data,s=0;for(let r=0;r<t*t;r++){let o=Xo(e,r);o&&s++;let a=o?0:255;i[r*4]=a,i[r*4+1]=a,i[r*4+2]=a,i[r*4+3]=255}this.maskTex.needsUpdate=!0,this.hasWater=s>0,this.water&&(this.water.visible=this.hasWater)}buildWater(e){let t=e.size,i=new di(t,t,1,1);i.rotateX(-Math.PI/2),i.translate(t/2,ul,t/2);let s=new St(i,this.waterMat);s.receiveShadow=!0,s.renderOrder=1,s.name="water",s.matrixAutoUpdate=!1,s.visible=this.hasWater,this.water=s,this.group.add(s)}buildSlab(e){let t=e.size,i=new Rs,s=.25,r=-.1;for(let c=0;c<4;c++)for(let u=0;u<t;u++){let d,h,f,p,x,g,m,b;c===0?(d=u,h=0,f=u,p=0,x=u+1,g=0,m=0,b=-1):c===1?(d=t-1,h=u,f=t,p=u,x=t,g=u+1,m=1,b=0):c===2?(d=u,h=t-1,f=u,p=t,x=u+1,g=t,m=0,b=1):(d=0,h=u,f=0,p=u,x=0,g=u+1,m=-1,b=0);let w=h*t+d,y=Xo(e,w),_=e.tiles.terrain[w],M=_===1&&!y,A=0;if(y){let S=wn.waterSide,C=wn.waterSideDeep,P=(ul+mr)/2;i.quad(f,ul,p,x,ul,g,x,P,g,f,P,p,m,0,b,S[0],S[1],S[2]),i.quad(f,P,p,x,P,g,x,mr,g,f,mr,p,m,0,b,C[0],C[1],C[2]),A=mr}else{let S=M?wn.quay:_===2?wn.lipSand:wn.lipGrass;i.quad(f,0,p,x,0,g,x,r,g,f,r,p,m,0,b,S[0],S[1],S[2]),A=r}let v=3+(ve(u,c,21)<.33?-1:ve(u,c,22)<.5?0:1);for(let S=0;;S++){let C=r-S*s,P=Math.max(Br,C-s);if(C<=Br)break;let D=Math.min(C,A);if(!(D<=P))for(let N=0;N<2;N++){let I=N*.5,U=I+.5,W=f+(x-f)*I,O=p+(g-p)*I,te=f+(x-f)*U,X=p+(g-p)*U,q=ve(u*2+N,S,30+c),$;S<v?$=q<.2?wn.dirtDark:q>.85?wn.dirtLight:wn.dirt:$=q<.3?wn.stoneDark:wn.stone;let he=1-Math.min(.25,S*.025),Q=(.94+q*.1)*he;i.quad(W,D,O,te,D,X,te,P,X,W,P,O,m,0,b,$[0]*Q,$[1]*Q,$[2]*Q)}}}let o=wn.bottom;i.quad(0,Br,0,t,Br,0,t,Br,t,0,Br,t,0,-1,0,o[0],o[1],o[2]);let a=i.build(!1,!1);this.slab&&this.disposeMesh(this.slab);let l=new St(a,this.slabMat);l.receiveShadow=!0,l.matrixAutoUpdate=!1,l.name="slab",this.slab=l,this.group.add(l)}};var Hr=128,Yo=4,ox=2,ax=0,lx=1,cx=2,ux=3,hx=4,qf=[[16,hx],[4,cx],[1,ax],[2,lx],[8,ux]];function pl(n,e,t,i,s){let r=Hr*.4;n.save(),n.fillStyle="rgba(20, 30, 50, 0.35)",n.beginPath(),n.arc(e,t+5,r+3,0,Math.PI*2),n.fill(),n.restore(),n.fillStyle="#ffffff",n.beginPath(),n.arc(e,t,r+3,0,Math.PI*2),n.fill(),n.fillStyle=i,n.beginPath(),n.arc(e,t,r-4,0,Math.PI*2),n.fill(),n.save(),n.translate(e,t),s(n),n.restore()}function _S(){let n=document.createElement("canvas");n.width=Hr*Yo,n.height=Hr*ox;let e=n.getContext("2d");e.lineJoin="round",e.lineCap="round";let t=s=>[s%Yo*Hr+Hr/2,Math.floor(s/Yo)*Hr+Hr/2-2];pl(e,...t(ax),"#f5a300",s=>{s.fillStyle="#ffffff",s.beginPath(),s.moveTo(6,-34),s.lineTo(-18,4),s.lineTo(-2,4),s.lineTo(-8,34),s.lineTo(18,-6),s.lineTo(2,-6),s.closePath(),s.fill()}),pl(e,...t(lx),"#2b8cf0",s=>{s.fillStyle="#ffffff",s.beginPath(),s.moveTo(0,-32),s.bezierCurveTo(10,-16,22,-2,22,10),s.arc(0,10,22,0,Math.PI,!1),s.bezierCurveTo(-22,-2,-10,-16,0,-32),s.fill(),s.fillStyle="rgba(43,140,240,0.55)",s.beginPath(),s.ellipse(-8,10,5,9,-.3,0,Math.PI*2),s.fill()}),pl(e,...t(cx),"#ef6a2e",s=>{s.fillStyle="#ffffff",s.fillRect(-3,-4,6,34),s.beginPath(),s.moveTo(0,-34),s.lineTo(22,-12),s.lineTo(0,10),s.lineTo(-22,-12),s.closePath(),s.fill(),s.fillStyle="#ef6a2e",s.fillRect(-2,-24,4,7),s.fillRect(-2,-13,4,7),s.fillRect(-2,-2,4,5)}),pl(e,...t(ux),"#7d6a8c",s=>{s.fillStyle="#ffffff",s.beginPath(),s.arc(-12,4,13,0,Math.PI*2),s.arc(4,-6,16,0,Math.PI*2),s.arc(16,6,11,0,Math.PI*2),s.fill(),s.fillRect(-24,4,44,13),s.strokeStyle="#7d6a8c",s.lineWidth=4,s.beginPath(),s.moveTo(-14,26),s.quadraticCurveTo(-6,20,2,26),s.quadraticCurveTo(10,32,18,26),s.stroke()}),pl(e,...t(hx),"#e5383b",s=>{s.fillStyle="#ffffff",s.beginPath(),s.moveTo(0,-30),s.lineTo(28,22),s.lineTo(-28,22),s.closePath(),s.fill(),s.fillStyle="#e5383b",s.fillRect(-3.5,-12,7,20),s.beginPath(),s.arc(0,15,4,0,Math.PI*2),s.fill()});let i=new Ui(n);return i.colorSpace=Wt,i.flipY=!1,i.generateMipmaps=!0,i.minFilter=Mi,i.magFilter=qt,i}var MS=22,wS=46,SS=`
attribute vec3 aPos;
attribute vec4 aIcons;
attribute float aCount;
attribute float aLod;
uniform float uTime;
uniform float uLod;
varying vec2 vUv;
void main() {
  // each badge belongs to one level of detail (\u22121 = every level); others collapse off-screen
  if (aLod > -0.5 && abs(aLod - uLod) > 0.5) {
    gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
    vUv = vec2(0.0);
    return;
  }
  float phase = fract(sin(dot(aPos.xz, vec2(12.9898, 78.233))) * 43758.5453);
  // several problems take turns, about two seconds each
  float k = mod(floor(uTime * 0.5 + phase * 3.0), max(aCount, 1.0));
  float icon = k < 0.5 ? aIcons.x : (k < 1.5 ? aIcons.y : (k < 2.5 ? aIcons.z : aIcons.w));
  vec3 wp = aPos + vec3(0.0, 0.07 * sin(uTime * 2.4 + phase * 6.2831), 0.0);
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  // keep badges readable when zoomed out: grow with distance, within limits
  float size = clamp(-mv.z * 0.036, 0.5, 2.2);
  mv.xy += position.xy * size;
  gl_Position = projectionMatrix * mv;
  vec2 cell = vec2(mod(icon, ${Yo}.0), floor(icon / ${Yo}.0));
  vUv = (vec2(uv.x, 1.0 - uv.y) + cell) / vec2(${Yo}.0, ${ox}.0);
}`,TS=`
uniform sampler2D uMap;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.05) discard;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`,lh=class{constructor(){this.cap=0;this.written=0;this.uniforms={uTime:{value:0},uLod:{value:1},uMap:{value:null}};let e=new di(1,1);this.geo=new La,this.geo.index=e.index,this.geo.setAttribute("position",e.getAttribute("position")),this.geo.setAttribute("uv",e.getAttribute("uv")),this.uniforms.uMap.value=_S(),this.mat=new vn({uniforms:this.uniforms,vertexShader:SS,fragmentShader:TS,transparent:!0,depthWrite:!1,depthTest:!0,toneMapped:!1}),this.aPos=new cn(new Float32Array(0),3),this.aIcons=new cn(new Float32Array(0),4),this.aCount=new cn(new Float32Array(0),1),this.aLod=new cn(new Float32Array(0),1),this.ensure(256),this.mesh=new St(this.geo,this.mat),this.mesh.frustumCulled=!1,this.mesh.renderOrder=20,this.mesh.name="status-icons",this.geo.instanceCount=0}ensure(e){e<=this.cap||(this.cap=Math.max(e,this.cap*2),this.aPos=new cn(new Float32Array(this.cap*3),3),this.aIcons=new cn(new Float32Array(this.cap*4),4),this.aCount=new cn(new Float32Array(this.cap),1),this.aLod=new cn(new Float32Array(this.cap),1),this.geo.setAttribute("aPos",this.aPos),this.geo.setAttribute("aIcons",this.aIcons),this.geo.setAttribute("aCount",this.aCount),this.geo.setAttribute("aLod",this.aLod))}put(e,t,i,s,r){let o=this.written,a=this.aIcons.array,l=0;for(let u=0;u<qf.length&&l<4;u++)s&qf[u][0]&&(a[o*4+l++]=qf[u][1]);if(l===0)return;for(let u=l;u<4;u++)a[o*4+u]=a[o*4];let c=this.aPos.array;c[o*3]=e,c[o*3+1]=t,c[o*3+2]=i,this.aCount.array[o]=l,this.aLod.array[o]=r,this.written++}rebuild(e,t){let i=e.size,s=i*i,r=e.tiles;this.ensure(s+Math.ceil(i/2)**2+Math.ceil(i/4)**2+4),this.written=0;let o=new Set;for(let a=0;a<s;a++){let l=r.problems[a];if(l)if(r.kind[a]===3){let c=r.bld[a];if(o.has(c))continue;o.add(c);let u=c>=0?e.buildings[c]:null,d=u?u.x+u.w/2:a%i+.5,h=u?u.z+u.h/2:(a/i|0)+.5;this.put(d,t(a)+.45,h,l,-1)}else this.put(a%i+.5,t(a)+.42,(a/i|0)+.5,l,0)}for(let a=1;a<=2;a++){let l=a===1?2:4;for(let c=0;c<i;c+=l)for(let u=0;u<i;u+=l){let d=0,h=0,f=0,p=0,x=0;for(let g=c;g<Math.min(i,c+l);g++)for(let m=u;m<Math.min(i,u+l);m++){let b=g*i+m,w=r.problems[b];!w||r.kind[b]===3||(d|=w,h++,f+=m+.5,p+=g+.5,x=Math.max(x,t(b)))}h&&this.put(f/h,x+.42,p/h,d,a)}}this.geo.instanceCount=this.written,this.mesh.visible=this.written>0,this.aPos.needsUpdate=!0,this.aIcons.needsUpdate=!0,this.aCount.needsUpdate=!0,this.aLod.needsUpdate=!0}update(e,t){this.uniforms.uTime.value=e,this.uniforms.uLod.value=t<MS?0:t<wS?1:2}dispose(){this.geo.dispose(),this.mat.dispose(),this.uniforms.uMap.value?.dispose()}};var ch=[0],Zf=[0],Kf=[0],Jf=[!1],dx=new Map;function $f(n){return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)}function ES(n){let e=n.charAt(0)==="#"?n.slice(1):n,t=parseInt(e.length===3?e[0]+e[0]+e[1]+e[1]+e[2]+e[2]:e,16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}function E(n,e=1,t=!1){let i=`${n}|${e.toFixed(3)}|${t?1:0}`,s=dx.get(i);if(s!==void 0)return s;let[r,o,a]=ES(n);if(e<=1)r*=e,o*=e,a*=e;else{let c=Math.min(1,e-1);r+=(1-r)*c,o+=(1-o)*c,a+=(1-a)*c}let l=ch.length;if(l>65535)throw new Error("voxel palette full");return ch.push($f(Math.min(1,r))),Zf.push($f(Math.min(1,o))),Kf.push($f(Math.min(1,a))),Jf.push(t),dx.set(i,l),l}function be(n,e=1){return E(n,e,!0)}function We(n,e={}){let t=E(n),i=E(n,e.dk??.93),s=E(n,e.lk??1.05),r=e.dark??.14,o=e.light??.1,[a,l,c]=e.cell??[2,1,2],u=e.seed??0;return(d,h,f)=>{let p=ve(Math.floor(d/a)+u*7919,Math.floor(h/l),Math.floor(f/c)+u*104729);return p<r?i:p>1-o?s:t}}function Ut(n,e=2,t=.94,i=0){let s=E(n),r=E(n,t);return(o,a)=>Math.floor((a+i)/e)%2===0?s:r}function Gr(n,e,t=1,i=.92){let s=E(n),r=E(n,i);return e==="x"?o=>Math.floor(o/t)%2===0?s:r:(o,a,l)=>Math.floor(l/t)%2===0?s:r}function uh(n,e,t,i=1){let s=E(n),r=E(e);return t==="x"?o=>Math.floor(o/i)%2===0?s:r:(o,a,l)=>Math.floor(l/i)%2===0?s:r}var AS={home:["#ffd27a","#ffc35e","#ffe2a2","#ffb555","#ffd890","#ffcb6e"],office:["#fff1cc","#e8f0ff","#ffe6a8","#dbe8ff","#fff6dc"],shop:["#ffe2a0","#ffd27e","#fff0c6"],factory:["#ffd98e","#ffcc73","#f6e7b8"],tower:["#ffd98a","#ffe9b8","#ffc86a","#eaf0ff","#ffdca0"]},RS={home:.58,office:.68,shop:.9,factory:.6,tower:.62},CS="#27324c";function Vr(n,e,t){let i=t??RS[n];if(e>=i)return be(CS);let s=AS[n],r=e/i,o=s[Math.floor(r*s.length)%s.length],a=ve(Math.floor(e*100003),7)<.25?.78:1;return be(o,a)}var si="#fff0c0";var ue={white:"#f4f1ea",cream:"#f3e6c8",concrete:"#c9c6bd",concreteDark:"#9e9b93",asphalt:"#4a4d55",metal:"#b8bec6",metalDark:"#7d848e",steel:"#8f99a6",darkMetal:"#545b66",wood:"#a8754a",woodDark:"#7a5233",trunk:"#8a5f3c",leaf:"#5db84a",leafDark:"#3f9a3f",leafLight:"#86d35a",pine:"#2f8a55",pineDark:"#22704a",hedge:"#4aa647",grass:"#78c850",soil:"#8c6a48",water:"#4fb3e8",door:"#7a4e32",doorBlue:"#3e5e8c",frame:"#f7f4ee",brick:"#c46a4a",brickDark:"#a65740",glass:"#5d86ad",black:"#2c2f36",red:"#e0504a",yellow:"#f5c542",orange:"#f08a3c",blue:"#3d7be0",teal:"#2fb3a6",pink:"#f39ab8",purple:"#9a7ad8",green:"#4cbf6a"};function Un(n,e,t,i,s,r,o,a,l,c={}){let u=c.overhang??1,d=c.rise??1,h=o==="x"?t:e,f=o==="x"?s:i,p=o==="x"?e:t,x=o==="x"?i:s,g=(b,w,y,_,M,A)=>{o==="x"?n.box(_,y,b,M,y+1,w,A):n.box(b,y,_,w,y+1,M,A)},m=0;for(;;m++){let b=Math.floor(m/d),w=h-u+b,y=f+u-1-b;if(w>y)break;let _=r+m,A=w+1>y-1&&c.ridge!==void 0?c.ridge:a,v=Math.max(h,w+1),S=Math.min(f,y);S>v&&g(v,S,_,p,x,l),g(w,w+1,_,p-u,x+u,A),g(y,y+1,_,p-u,x+u,A)}return r+m}function Wr(n,e,t,i,s,r,o,a={}){let l=a.overhang??1,c=a.rise??1,u=0;for(;;u++){let d=Math.floor(u/c),h=e-l+d,f=i+l-d,p=t-l+d,x=s+l-d;if(h>=f||p>=x)break;let g=h+2>=f||p+2>=x;n.box(h,r+u,p,f,r+u+1,x,g&&a.ridge!==void 0?a.ridge:o)}return r+u}function Sn(n,e,t,i,s,r,o,a=1){n.box(e,r,t,i,r+a,t+1,o),n.box(e,r,s-1,i,r+a,s,o),n.box(e,r,t,e+1,r+a,s,o),n.box(i-1,r,t,i,r+a,s,o)}function De(n,e,t,i,s,r,o){let a=i*i;for(let l=Math.floor(t-i-1);l<=Math.ceil(t+i+1);l++)for(let c=Math.floor(e-i-1);c<=Math.ceil(e+i+1);c++){let u=c+.5-e,d=l+.5-t;u*u+d*d<=a&&n.box(c,s,l,c+1,r,l+1,o)}}function qo(n,e,t,i,s,r,o,a){let l=s*s;for(let c=Math.floor(i-s-1);c<=Math.ceil(i+s+1);c++)for(let u=Math.floor(t-s-1);u<=Math.ceil(t+s+1);u++){let d=c+.5-i,h=u+.5-t;d*d+h*h>l||(e==="x"?n.box(r,c,u,o,c+1,u+1,a):n.box(u,c,r,u+1,c+1,o,a))}}function hh(n,e,t,i,s,r,o,a,l=!1){for(let c=Math.floor(t-r-1);c<=Math.ceil(t+r+1);c++)if(!(l&&c+.5<t))for(let u=Math.floor(i-o-1);u<=Math.ceil(i+o+1);u++)for(let d=Math.floor(e-s-1);d<=Math.ceil(e+s+1);d++){let h=(d+.5-e)/s,f=(c+.5-t)/r,p=(u+.5-i)/o;h*h+f*f+p*p<=1&&n.put(d,c,u,a)}}function Ke(n,e,t,i,s,r){let o=r.faces??15,a=r.margin??1;for(let l=0;l<4;l++){if(!(o&1<<l))continue;let c=l===0||l===2?e:t,d=(l===0||l===2?i:s)-c,h=Math.floor((d-2*a-r.w)/r.pitch)+1;if(h<=0)continue;let f=(h-1)*r.pitch+r.w,p=c+Math.floor((d-f)/2);for(let x=0;x<r.floors;x++){let g=r.y0+x*r.floorH+r.sill;for(let m=0;m<h;m++){let b=p+m*r.pitch;if(r.skip&&r.skip(l,b,x))continue;let w=Vr(r.style,ve(r.seed*977+l*131+m,x,b),r.litShare);st(n,l,b,b+r.w,g,g+r.h,l===0?s-1:l===1?i-1:l===2?t:e,w,!!r.inset)}}}}function st(n,e,t,i,s,r,o,a,l=!1){let c=e===0||e===1?-1:1;for(let u=s;u<r;u++)for(let d=t;d<i;d++){let h=e===0||e===2?d:o,f=e===0||e===2?o:d;n.get(h,u,f)!==0&&(l?(n.set(h,u,f,0),e===0||e===2?n.put(h,u,f+c,a):n.put(h+c,u,f,a)):n.put(h,u,f,a))}}function ml(n,e,t,i,s,r,o,a,l,c,u,d=2,h=1){Ke(n,e,t,i,s,{y0:r,floors:o,floorH:a,sill:h,h:l,w:d,pitch:d,margin:0,style:c,seed:u})}function jf(n,e,t,i,s,r,o,a){let l=.96+ve(a,71)*.08,c=E(o,.82*l),u=E(o,l),d=E(o,1.1);for(let h=0;h<r;h++){let f=h===0||h===r-1,p=f?s-1:s;if(p<0)continue;let x=h===0?c:h===r-1?d:u,g=!f&&p>1;for(let m=-p;m<=p;m++)for(let b=-p;b<=p;b++)g&&Math.abs(b)===p&&Math.abs(m)===p||n.set(e+b,i+h,t+m,x)}s>=2&&n.box(e,i+r,t,e+1,i+r+1,t+1,d)}function Wi(n,e,t,i,s,r=2,o=ue.leaf){let a=r+1;n.box(e,i,t,e+1,i+a,t+1,E(ue.trunk)),jf(n,e,t,i+a,r,r+2,o,s)}function Ps(n,e,t,i,s,r=9,o=ue.pine){let a=.96+ve(s,73)*.08,l=E(o,.84*a),c=E(o,a),u=E(o,1.1);n.box(e,i,t,e+1,i+2,t+1,E(ue.trunk));let d=r>=10?[[3,2],[2,2],[2,2],[1,2]]:r>=8?[[2,2],[2,2],[1,2]]:[[2,2],[1,2]],h=i+2;for(let[f,p]of d)for(let x=0;x<p;x++){let g=Math.max(0,f-x),m=x===0?l:c;for(let b=-g;b<=g;b++)for(let w=-g;w<=g;w++)g>=3&&Math.abs(w)===g&&Math.abs(b)===g||n.set(e+w,h,t+b,m);h++}n.box(e,h,t,e+1,h+1,t+1,u)}function Rt(n,e,t,i,s,r,o,a,l=ue.hedge){n.box(e,i,t,e+s,i+o,t+r,We(l,{dark:.25,dk:.88,light:.2,lk:1.08,cell:[1,1,1],seed:a}))}function Xi(n,e,t,i,s,r,o){let a=["#ff6f8e","#ffd84a","#ffffff","#c58cff","#ff9d4a"].map(c=>E(c)),l=E(ue.leafDark);for(let c=t;c<s;c++)for(let u=e;u<i;u++){let d=ve(u+o*13,c,o);n.set(u,r,c,l),d<.55&&n.set(u,r+1,c,a[Math.floor(d*9.1)%a.length])}}function Qf(n,e,t,i,s,r,o=ue.frame,a=[]){let l=E(o);for(let c=t;c<i;c++){if(a.some(([h,f])=>c>=h&&c<f))continue;let d=(c-t)%2===0?2:1;e==="x"?n.box(c,r,s,c+1,r+d,s+1,l):n.box(s,r,c,s+1,r+d,c+1,l)}}function Yt(n,e,t,i,s=2,r=2){n.box(e,t,i,e+s,t+1,i+r,E(ue.metal)),n.box(e,t+1,i,e+s,t+2,i+r,E(ue.metal,1.06)),n.set(e,t+1,i,E(ue.darkMetal))}function px(n,e,t,i){let s=E(ue.darkMetal);n.box(e,i,t,e+1,i+2,t+1,s),n.box(e+3,i,t,e+4,i+2,t+1,s),n.box(e,i,t+3,e+1,i+2,t+4,s),n.box(e+3,i,t+3,e+4,i+2,t+4,s);let r=We(ue.wood,{dark:.3,dk:.88,cell:[1,8,1],seed:e*3+t});De(n,e+2,t+2,2.2,i+2,i+6,r),n.box(e+1,i+6,t+1,e+3,i+7,t+3,E(ue.woodDark)),n.box(e+1,i+4,t,e+3,i+5,t+4,E(ue.darkMetal)),n.box(e,i+4,t+1,e+4,i+5,t+3,E(ue.darkMetal))}function Ei(n,e,t,i,s,r="#ff5a4a"){return n.box(e,i,t,e+1,i+s,t+1,E(ue.metal)),n.set(e,i+s,t,be(r)),i+s+1}function mx(n,e,t,i,s,r){let o=E("#2d4f8a"),a=E("#3b64a8"),l=E(ue.metal);for(let c=t;c<s;c++){let u=(c-t)%3;u!==2&&(n.box(e,r+(u===0?0:1),c,i,r+(u===0?1:2),c+1,u===0?o:a),u===0&&n.box(e,r,c,e+1,r+1,c+1,l))}}function Yi(n,e,t,i,s="x"){let r=E(ue.wood),o=E(ue.darkMetal);s==="x"?(n.box(e,i,t,e+1,i+1,t+1,o),n.box(e+2,i,t,e+3,i+1,t+1,o),n.box(e,i+1,t,e+3,i+2,t+1,r),n.box(e,i+2,t-1,e+3,i+3,t,r)):(n.box(e,i,t,e+1,i+1,t+1,o),n.box(e,i,t+2,e+1,i+1,t+3,o),n.box(e,i+1,t,e+1,i+2,t+3,r),n.box(e-1,i+2,t,e,i+3,t+3,r))}function gi(n,e,t,i,s=5){n.box(e,i,t,e+1,i+s,t+1,E(ue.darkMetal)),n.set(e,i+s,t,be(si))}function xr(n,e,t,i,s){let r=E(ue.wood),o=E(ue.wood,.86);n.box(e,i,t,e+2,i+1,t+2,r),ve(s,e,t)<.6&&n.box(e,i+1,t,e+1,i+2,t+1,o),ve(s,t,e)<.5&&n.box(e+2,i,t,e+3,i+1,t+1,o)}function cs(n,e,t,i,s){n.box(e,i,t,e+1,i+2,t+1,E(s))}function ri(n,e,t,i,s,r,o,a=ue.metal){let l=[E(a),E(a,.88)];st(n,e,t,i,s,r,o,(c,u)=>l[(u-s)%2])}function ep(n,e,t,i,s,r,o){n.box(e,i,t,e+1,i+s,t+1,E(ue.white)),n.box(e+1,i+s-3,t,e+4,i+s-2,t+1,E(r)),n.box(e+1,i+s-2,t,e+4,i+s-1,t+1,E(o))}function Xr(n,e,t,i,s,r,o,a,l,c,u,d=12,h=.18){let f=Math.floor(e-i-1),p=Math.ceil(e+i+1),x=Math.floor(t-i-1),g=Math.ceil(t+i+1);for(let m=0;m<r;m++){let b=s+m*o+a;for(let w=b;w<b+l;w++)for(let y=x;y<=g;y++)for(let _=f;_<=p;_++){if(n.get(_,w,y)===0||n.get(_+1,w,y)&&n.get(_-1,w,y)&&n.get(_,w,y+1)&&n.get(_,w,y-1))continue;let M=(Math.atan2(y+.5-t,_+.5-e)/(Math.PI*2)+1)%1*d;M-Math.floor(M)<h||n.set(_,w,y,Vr(c,ve(u*31+Math.floor(M),m,5)))}}}function dh(n,e,t,i,s,r,o){for(let a=0;a<r;a++)n.box(e,i-a,s+a,t,i-a+1,s+a+1,o)}var fx=[[7,5,7],[7,6,7],[5,7,5],[6,7,6],[7,2,2],[4,4,7],[3,2,6],[5,5,7],[7,5,5]];function us(n,e,t,i,s,r,o,a,l){n.box(e,i,r,t,s,r+1,E(o));let c=be(a);if(s-i<5){for(let p=e+1;p<t-1;p++)((p-e)%4!==0||t-e<6)&&n.set(p,i+1+(s-i-2>>1),r,c);if(s-i===4)for(let p=e+1;p<t-1;p++)ve(p,l,3)<.5&&n.set(p,i+2,r,c);return}let u=t-e-2,d=Math.max(1,Math.floor((u+1)/4)),h=e+1+Math.floor((u-(d*4-1))/2),f=i+1+Math.floor((s-i-2-3)/2);for(let p=0;p<d;p++){let x=fx[Math.floor(ve(l,p,11)*fx.length)];for(let g=0;g<3;g++)for(let m=0;m<3;m++)x[g]&4>>m&&n.set(h+p*4+m,f+2-g,r,c)}}function gl(n,e,t,i,s,r,o){let a=E(ue.soil),l=We(ue.grass,{dark:.2,dk:.9,cell:[2,1,2],seed:o});n.box(e,r,t,i,r+1,s,l),Sn(n,e,t,i,s,r,E(ue.concrete,1.03),2);let c=i-e,u=s-t;c>=6&&u>=6&&Wi(n,e+2,t+2,r+1,o,c>=9?2:1,ue.leaf),Rt(n,i-3,s-3,r+1,2,2,1,o+1),c>=5&&Xi(n,i-4,t+1,i-1,t+2,r+1,o),n.set(e+1,r+1,s-2,a)}function oi(n,e,t,i,s,r,o=ue.door,a=!0){st(n,0,e,e+t,i,i+s,r,E(o)),a&&n.set(e+t,i+s,r+1,be(si))}function hs(n,e,t,i,s,r,o,a,l){let c=Ut(o,2,.93);if(a){let u=E(o),d=E(a),h=l!==void 0?r-l:s;De(n,e,t,i,s,r,(f,p,x)=>p<h?c(f,p,x):Math.floor((r-p)/3)%2===0?u:d)}else De(n,e,t,i,s,r,c);if(De(n,e,t,i+.5,r-1,r,E("#4a4d55")),i>=1&&De(n,e,t,Math.max(.6,i-.8),r-1,r,0),r-s>=40){let u=be("#ff4436"),d=r-3,h=Math.floor(e),f=Math.floor(t);for(let p of[-1,1])for(let x=Math.ceil(i)+1;x>=0;x--){let g=f+p*x;if(n.get(h,d,g)!==0){n.set(h,d,g,u);break}}}return[e,r,t]}function Is(n,e,t="#fff0b8"){let i=be(t);for(let[s,r,o]of e)n.set(s,r,o,i)}function xl(n,e,t,i,s,r,o,a){let l=We(o,{cell:[2,1,2],dark:.3,dk:.85,light:.2,lk:1.1,seed:a});for(let c=0;c<r&&!(e+c>=i-c||t+c>=s-c);c++)n.box(e+c,c,t+c,i-c,c+1,s-c,l)}function tp(n,e,t,i,s,r,o,a="#ff4a4a"){n.box(e,t,i,e+s,t+r,i+o,E("#fbfbf8"));let l=e+Math.floor(s/2),c=t+Math.floor(r/2),u=Math.max(1,Math.floor(Math.min(s,r)/2)-1),d=be(a);for(let h of[i,i+o-1])for(let f=-u;f<u;f++)for(let p of[-1,0])n.set(l+f,c+p,h,d),n.set(l+p,c+f,h,d)}var xi=16,rn=class{constructor(e,t,i){this.nx=e;this.ny=t;this.nz=i;this.data=new Uint16Array(e*t*i)}get(e,t,i){return e<0||t<0||i<0||e>=this.nx||t>=this.ny||i>=this.nz?0:this.data[(t*this.nz+i)*this.nx+e]}set(e,t,i,s){e<0||t<0||i<0||e>=this.nx||t>=this.ny||i>=this.nz||(this.data[(t*this.nz+i)*this.nx+e]=s)}put(e,t,i,s){this.set(e,t,i,typeof s=="number"?s:s(e,t,i))}box(e,t,i,s,r,o,a){let l=Math.max(0,Math.floor(Math.min(e,s))),c=Math.min(this.nx,Math.floor(Math.max(e,s))),u=Math.max(0,Math.floor(Math.min(t,r))),d=Math.min(this.ny,Math.floor(Math.max(t,r))),h=Math.max(0,Math.floor(Math.min(i,o))),f=Math.min(this.nz,Math.floor(Math.max(i,o))),p=typeof a=="number"?a:-1;for(let x=u;x<d;x++)for(let g=h;g<f;g++){let m=(x*this.nz+g)*this.nx+l;for(let b=l;b<c;b++,m++)this.data[m]=p>=0?p:a(b,x,g)}}paintSolid(e,t,i,s,r,o,a){for(let l=Math.max(0,t);l<Math.min(this.ny,r);l++)for(let c=Math.max(0,i);c<Math.min(this.nz,o);c++)for(let u=Math.max(0,e);u<Math.min(this.nx,s);u++){let d=(l*this.nz+c)*this.nx+u;this.data[d]!==0&&(this.data[d]=typeof a=="number"?a:a(u,l,c))}}topY(){let e=this.nx*this.nz;for(let t=this.ny-1;t>=0;t--){let i=t*e;for(let s=0;s<e;s++)if(this.data[i+s]!==0)return t+1}return 0}};function gx(){return{pos:[],nor:[],col:[]}}var ds=class{constructor(){this.body=gx();this.glow=gx()}get triangles(){return(this.body.pos.length+this.glow.pos.length)/9}append(e,t=0,i=0,s=0,r=0,o=1){let a=(r%4+4)%4*(Math.PI/2),l=Math.round(Math.cos(a)),c=Math.round(Math.sin(a));for(let[u,d]of[[e.body,this.body],[e.glow,this.glow]])for(let h=0;h<u.pos.length;h+=3){let f=u.pos[h]*o,p=u.pos[h+1]*o,x=u.pos[h+2]*o;d.pos.push(l*f+c*x+t,p+i,-c*f+l*x+s);let g=u.nor[h],m=u.nor[h+2];d.nor.push(l*g+c*m,u.nor[h+1],-c*g+l*m),d.col.push(u.col[h],u.col[h+1],u.col[h+2])}}appendRotZ(e,t,i=0,s=0,r=0){let o=Math.cos(t),a=Math.sin(t);for(let[l,c]of[[e.body,this.body],[e.glow,this.glow]])for(let u=0;u<l.pos.length;u+=3){let d=l.pos[u],h=l.pos[u+1];c.pos.push(o*d-a*h+i,a*d+o*h+s,l.pos[u+2]+r);let f=l.nor[u],p=l.nor[u+1];c.nor.push(o*f-a*p,a*f+o*p,l.nor[u+2]),c.col.push(l.col[u],l.col[u+1],l.col[u+2])}}toGeometries(){return{body:xx(this.body),glow:this.glow.pos.length?xx(this.glow):null}}};function xx(n){let e=new zt;return e.setAttribute("position",new kt(n.pos,3)),e.setAttribute("normal",new kt(n.nor,3)),e.setAttribute("color",new kt(n.col,3)),e.computeBoundingBox(),e.computeBoundingSphere(),e}function $o(n,e,t,i,s,r,o=!1){let a=[n.nx,n.ny,n.nz],l=[1,n.nx*n.nz,n.nx],c=[i,s,r],u=n.data,d=[0,0,0],h=new Array(12);for(let f=0;f<3;f++){let p=(f+1)%3,x=(f+2)%3,g=a[p],m=a[x],b=a[f],w=l[f],y=l[p],_=l[x],M=new Int32Array(g*m);for(let A=0;A<=b;A++){let v=0,S=!1;for(let C=0;C<m;C++)for(let P=0;P<g;P++,v++){let D=P*y+C*_,N=A>0?u[D+(A-1)*w]:0,I=A<b?u[D+A*w]:0,U=N!==0&&I===0?N:I!==0&&N===0?-I:0;o&&f===1&&A===0&&(U=0),M[v]=U,U!==0&&(S=!0)}if(S){v=0;for(let C=0;C<m;C++)for(let P=0;P<g;){let D=M[v];if(D===0){P++,v++;continue}let N=1;for(;P+N<g&&M[v+N]===D;)N++;let I=1;e:for(;C+I<m;){let he=v+I*g;for(let Q=0;Q<N;Q++)if(M[he+Q]!==D)break e;I++}for(let he=0;he<I;he++)M.fill(0,v+he*g,v+he*g+N);let U=[[P,C],[P+N,C],[P+N,C+I],[P,C+I]];for(let he=0;he<4;he++)d[f]=A,d[p]=U[he][0],d[x]=U[he][1],h[he*3]=(d[0]-c[0])*t,h[he*3+1]=(d[1]-c[1])*t,h[he*3+2]=(d[2]-c[2])*t;let W=D>0?D:-D,O=Jf[W]?e.glow:e.body,te=D>0?[0,1,2,0,2,3]:[0,2,1,0,3,2],X=f===0?Math.sign(D):0,q=f===1?Math.sign(D):0,$=f===2?Math.sign(D):0;for(let he of te)O.pos.push(h[he*3],h[he*3+1],h[he*3+2]),O.nor.push(X,q,$),O.col.push(ch[W],Zf[W],Kf[W]);P+=N,v+=N}}}}}function bx(n,e=new ds){return $o(n,e,1/xi,n.nx/2,0,n.nz/2,!0),e}var Mx=48,yx="#fff3cf",vx="#ff3a2e",PS="#3c5270",IS="#26282d",Ls=[{paint:"#e8483f",kind:"sedan"},{paint:"#3f7fe6",kind:"hatch"},{paint:"#f6c94a",kind:"sedan",accent:"#fff4d8"},{paint:"#f2f2ee",kind:"van",accent:"#5aa9e6"},{paint:"#3fbf86",kind:"hatch"},{paint:"#f08a3c",kind:"truck",accent:"#eceae2"}];function bl(n,e,t){let i=E(IS),s=E("#9aa2ad");for(let r of t)for(let o of[0,e-1])n.box(o,0,r,o+1,2,r+3,i),n.set(o,1,r+1,s)}function yl(n,e,t,i,s){n.set(1,s,t,be(yx)),n.set(e-2,s,t,be(yx)),n.set(1,s,i,be(vx)),n.set(e-2,s,i,be(vx))}function LS(n){let e=E(n.paint),t=E(n.paint,.86),i=E(PS),s=E("#5a5f68"),r=7;if(n.kind==="sedan"||n.kind==="hatch"||n.kind==="police"){let l=new rn(r,8,14);l.box(0,1,0,r,3,14,e),l.box(0,1,0,r,2,14,t);let c=n.kind==="hatch"?2:4,u=(n.kind==="hatch",10);l.box(1,3,c,r-1,5,u,i);let d=n.kind==="police"?E("#f7f7f4"):n.accent?E(n.accent):e;return l.box(1,5,c+(n.kind==="hatch"?0:1),r-1,6,u-1,d),l.box(1,3,c+2,r-1,5,c+3,d),n.kind==="police"&&(l.box(0,2,4,r,3,10,E("#f7f7f4")),l.set(2,6,6,be("#ff3b3b")),l.set(3,6,6,be("#ffffff",.9)),l.set(4,6,6,be("#3b7bff"))),l.box(0,1,13,r,2,14,s),l.box(0,1,0,r,2,1,s),bl(l,r,[2,9]),yl(l,r,13,0,2),l}if(n.kind==="bus"){let l=new rn(r+1,11,24),c=r+1;l.box(0,1,0,c,8,24,e),l.box(0,1,0,c,2,24,E("#2c2f36")),l.box(0,7,0,c,8,24,E(n.paint,1.06));for(let u=2;u<20;u+=3)l.box(0,4,u,c,6,u+2,i);return l.box(1,4,23,c-1,6,24,i),l.box(0,3,0,c,4,24,E("#2c2f36")),bl(l,c,[2,18]),yl(l,c,23,0,2),l}if(n.kind==="van"||n.kind==="ambulance"){let l=new rn(r,10,15);return l.box(0,1,0,r,7,15,e),l.box(0,1,0,r,2,15,t),l.box(0,6,13,r,7,15,0),l.box(1,4,14,r-1,6,15,i),l.box(0,4,11,r,6,13,i),l.box(1,4,11,r-1,6,13,e),l.box(1,4,13,r-1,6,14,i),n.accent&&l.box(0,3,1,r,4,11,E(n.accent)),n.kind==="ambulance"&&(l.set(1,7,11,be("#ff3b3b")),l.set(r-2,7,11,be("#3b7bff")),l.box(2,7,4,r-2,8,6,E(n.accent??"#e0504a"))),l.box(0,1,14,r,2,15,s),bl(l,r,[2,10]),yl(l,r,14,0,2),l}if(n.kind==="truck"){let l=new rn(r,11,17);l.box(0,1,12,r,6,17,e),l.box(0,1,12,r,2,17,t),l.box(1,4,16,r-1,6,17,i),l.box(0,4,13,r,6,15,i),l.box(1,4,13,r-1,6,15,e),l.box(1,6,12,r-1,7,16,e);let c=E(n.accent??"#eceae2");return l.box(0,2,0,r,9,12,c),l.box(0,8,0,r,9,12,E(n.accent??"#eceae2",.92)),l.box(0,1,0,r,2,12,s),l.box(1,4,0,r-1,6,1,E(n.paint)),bl(l,r,[1,5,13]),yl(l,r,16,0,2),l}let o=new rn(r+1,11,22),a=r+1;return o.box(0,1,0,a,6,22,e),o.box(0,3,0,a,4,22,E("#f4f1ea")),o.box(1,4,20,a-1,6,22,i),o.box(0,4,17,a,6,19,i),o.box(1,6,1,a-1,7,17,E(ue.metal)),o.box(2,7,2,a-2,8,16,E(ue.metalDark)),o.set(2,6,19,be("#ff3b3b")),o.set(a-3,6,19,be("#3b7bff")),o.box(0,1,21,a,2,22,s),bl(o,a,[2,7,16]),yl(o,a,21,0,2),o}var _x=new Map;function vl(n,e){let t=_x.get(n);if(!t){let i=LS(e);t=new ds,$o(i,t,1/Mx,i.nx/2,0,i.nz/2,!0),_x.set(n,t)}return t}var wx=Ls.length;function br(n){let e=(n%Ls.length+Ls.length)%Ls.length;return vl(`car${e}`,Ls[e])}function Sx(n){let e=(n%Ls.length+Ls.length)%Ls.length,t=Ls[e].kind;return(t==="truck"?9:t==="van"?7:6)/Mx}function np(){return vl("police",{paint:"#2f4f9a",kind:"police"})}function Tx(){return vl("bus",{paint:"#f6c234",kind:"bus"})}function fh(){return vl("ambulance",{paint:"#f7f7f4",accent:"#e0504a",kind:"ambulance"})}function Ex(){return vl("fire",{paint:"#e23b30",kind:"fire"})}function Wn(n,e){return new rn(n*16,e,n*16)}function DS(){let n=Wn(3,80);xl(n,2,2,16,14,5,"#55565e",600),xl(n,3,16,12,25,3,"#5d5e66",601);let e=E("#f2c94c");for(let o=0;o<10;o++)n.box(8+o,6+o*2,9,9+o,8+o*2,11,e);for(let o of[2,5,8])n.box(8+o,0,9,9+o,6+o*2,10,E(ue.darkMetal));let t=We("#9298a0",{seed:602,cell:[6,4,6],dark:.25});n.box(18,0,6,36,28,30,t),n.box(18,27,6,36,28,30,E("#5a6068")),Ke(n,18,6,36,30,{y0:4,floors:4,floorH:6,sill:1,h:3,w:2,pitch:4,style:"factory",seed:603,faces:10}),n.box(22,28,10,32,31,26,E("#6e747c"));let i=We("#e1e5ea",{seed:604,cell:[6,4,6],dark:.2});n.box(8,0,30,40,14,42,i),n.box(8,11,30,40,12,42,E("#3d7be0")),n.box(8,14,30,40,15,42,E("#5a6068")),Ke(n,8,30,40,42,{y0:0,floors:1,floorH:11,sill:5,h:4,w:3,pitch:4,style:"factory",seed:605,skip:(o,a)=>o===0&&a>=20&&a<=27}),ri(n,0,20,28,0,8,41,"#c9ced6"),n.set(19,9,42,be(si)),n.set(28,9,42,be(si));let s=[hs(n,41,9,3,0,76,"#d6d3cb","#e0504a",18),hs(n,41,22,2.4,0,62,"#d6d3cb","#e0504a",12)];n.box(36,12,8,38,14,10,E(ue.steel)),n.box(36,16,21,39,18,23,E(ue.steel));let r=E("#8c939c");for(let o of[32,38])n.box(42,0,o,46,4,o+4,r),n.box(43,4,o+1,44,6,o+2,E("#c9a36a")),n.box(44,4,o+2,45,6,o+3,E("#c9a36a"));for(let o of[31,46])n.box(41,0,o,47,1,o+1,E(ue.darkMetal));return gi(n,6,44,0,6),{g:n,smoke:s}}function kS(){let n=new rn(3,26,1),e=E("#f7f7f4");n.box(0,0,0,3,9,1,e),n.box(0,9,0,2,19,1,e),n.box(0,19,0,2,22,1,E("#e0504a")),n.box(0,22,0,1,26,1,E("#e0504a"));let t=new ds;return $o(n,t,1/32,1.5,-2,.5),t}function NS(){let n=Wn(1,48);n.box(3,0,3,13,1,13,E(ue.concrete));let e=Ut("#f4f4f0",6,.96);n.box(6,1,6,10,14,10,e),n.box(7,14,7,9,43,9,e),st(n,0,7,9,1,4,9,E("#6d7a88")),n.box(6,42,4,10,46,12,E("#eeeeea")),n.box(6,42,4,10,43,12,E("#d4d4ce")),n.set(8,46,5,be("#ff4a3a")),n.box(11,1,10,14,4,13,E("#9aa3ad")),n.box(11,3,13,14,4,14,0),n.set(12,2,13,E("#f2c94c"));let t=new ds,i=new rn(4,4,3);i.box(0,0,0,4,4,3,E("#e6e6e0")),i.box(1,1,2,3,3,3,E("#cfcfc8")),$o(i,t,1/32,2,2,1.5);let s=kS();for(let r=0;r<3;r++)t.appendRotZ(s,r*Math.PI*2/3,0,0,.01);return{g:n,spinner:{mesh:t,at:[8,44,13],axis:"z",speed:1.6,reach:28/32}}}function US(){let n=Wn(2,10),e=E("#2c4f8e"),t=E("#355ea6"),i=E("#c9d0d8"),s=E(ue.darkMetal);for(let r of[3,10,17,24]){for(let o of[8,15,22,28])n.box(o,0,r+1,o+1,3,r+2,s);for(let o=0;o<3;o++){let a=r+o,l=4-o,c=u=>(u-6)%4===0?i:o%2?t:e;n.box(6,l,a,30,l+1,a+1,c)}}n.box(1,0,11,5,5,18,E("#eceae2")),n.box(0,5,10,6,6,19,E("#5a6270")),st(n,1,13,16,0,4,4,E("#5a6270")),n.set(5,4,17,be(si));for(let r=1;r<31;r+=3)n.box(r,0,30,r+1,2,31,E(ue.metalDark));return n.box(1,1,30,31,2,31,E(ue.metal)),{g:n}}function OS(){let n=Wn(1,40),e=E("#7d8a99");for(let[t,i]of[[3,3],[12,3],[3,12],[12,12]])n.box(t,0,i,t+1,21,i+1,e);for(let t of[7,14])n.box(3,t,3,13,t+1,4,e),n.box(3,t,12,13,t+1,13,e),n.box(3,t,3,4,t+1,13,e),n.box(12,t,3,13,t+1,13,e);n.box(7,4,7,9,19,9,E("#9aa6b2")),n.box(5,0,5,11,4,11,E("#e9e4d8")),n.box(5,4,5,11,5,11,E("#3d7be0")),st(n,0,7,9,0,3,10,E("#3d5a80")),n.set(9,3,11,be(si)),De(n,8,8,3,18,19,E("#5aa9e6")),De(n,8,8,5.2,19,20,E("#5aa9e6")),De(n,8,8,6.8,20,21,E("#c9d0d8")),De(n,8,8,6,21,31,Ut("#68b8ea",3,.95,1)),De(n,8,8,6.05,25,27,E("#f4f4f0")),De(n,8,8,6.5,31,32,E("#3d6fae")),De(n,8,8,5,32,33,E("#3d6fae")),De(n,8,8,3.5,33,34,E("#4a7cbc")),De(n,8,8,2,34,35,E("#4a7cbc")),n.box(7,35,7,9,36,9,E(ue.metal)),n.set(8,36,8,be("#ff4a3a"));for(let t=1;t<21;t+=2)n.set(12,t,13,E(ue.darkMetal));return{g:n}}function FS(){let n=Wn(2,22),e=Ut("#c47a5a",1,.94);n.box(6,0,10,24,10,23,e),n.box(6,0,10,24,1,23,E("#8f8577")),Un(n,6,10,24,23,10,"x",We("#4f6b8f",{seed:610,cell:[3,1,1]}),e,{ridge:E("#3f5878")}),Ke(n,6,10,24,23,{y0:0,floors:1,floorH:10,sill:3,h:4,w:2,pitch:4,style:"factory",seed:611,skip:(i,s)=>i===0&&s>=13&&s<=16}),oi(n,14,2,1,5,22,"#3d5a80");let t=E("#3d7be0");return qo(n,"x",6,3,2,2,30,t),qo(n,"x",6,3,2.4,9,11,E("#2f62b8")),qo(n,"x",6,3,2.4,20,22,E("#2f62b8")),n.box(2,0,5,5,5,8,t),n.box(27,0,5,30,5,8,t),n.box(15,5,4,16,8,5,E("#e0504a")),n.box(14,7,4,17,8,5,E("#e0504a")),n.box(15,5,5,16,10,10,t),De(n,27,26,4.2,0,3,E(ue.concrete)),De(n,27,26,3.2,1,3,0),De(n,27,26,3.2,1,2,E("#4fb3e8")),gi(n,3,25,0,6),{g:n}}function BS(){let n=Wn(1,14);return Wi(n,4,4,0,620,2,"#5db84a"),Ps(n,12,3,0,621,8),De(n,5,11.5,3.2,0,2,E("#cfc8b8")),De(n,5,11.5,2.3,1,2,0),De(n,5,11.5,2.3,0,1,E("#4fb3e8")),Yi(n,10,14,0,"x"),Xi(n,9,8,14,10,0,622),gi(n,13,13,0,5),Rt(n,8,4,0,2,2,1,623),{g:n}}function zS(){let n=Wn(2,22);De(n,16,16,7.4,0,2,E("#d8d0c0")),De(n,16,16,6.4,1,2,0),De(n,16,16,6.4,0,1,E("#56b8ea"));for(let e=0;e<8;e++){let t=e/8*Math.PI*2;n.set(Math.floor(16+Math.cos(t)*5.6),0,Math.floor(16+Math.sin(t)*5.6),be("#9ff3ff"))}De(n,16,16,1.5,0,6,E("#e4ddd0")),De(n,16,16,3.4,5,6,E("#e4ddd0")),De(n,16,16,2.4,6,7,E("#7fd0f2")),De(n,16,16,.9,6,10,E("#bfefff")),n.box(15,10,15,17,11,17,E("#e8fbff"));for(let[e,t]of[[4,4],[27,4],[4,27],[27,27]])n.box(e-2,0,t-2,e+3,2,t+3,E("#c9bfae")),n.box(e-1,1,t-1,e+2,2,t+2,E(ue.soil)),Wi(n,e,t,2,630+e+t,2,e<16?"#5db84a":"#73c44f");Yi(n,15,26,0,"x"),Yi(n,15,6,0,"x"),Yi(n,6,15,0,"z"),Yi(n,26,15,0,"z");for(let[e,t]of[[10,10],[21,10],[10,21],[21,21]])gi(n,e,t,0,6);return Xi(n,12,1,20,3,0,640),Xi(n,12,29,20,31,0,641),{g:n}}function HS(){let n=Wn(2,30),e=We("#f2f4f6",{seed:650,cell:[6,3,6],dark:.2}),t=E("#2f5fb3");n.box(3,0,5,29,13,20,e),n.box(3,0,5,29,1,20,E("#8d96a3")),n.box(3,6,5,29,7,20,t),Sn(n,3,5,29,20,13,t),Ke(n,3,5,29,20,{y0:0,floors:2,floorH:6,sill:2,h:3,w:3,pitch:4,style:"office",seed:651,skip:(s,r,o)=>s===0&&o===0&&r>=12&&r<=18}),st(n,0,13,19,0,5,19,be("#e8f0ff")),n.box(11,5,20,21,6,23,t),n.set(11,4,22,be("#5a9bff")),n.set(20,4,22,be("#5a9bff")),us(n,10,22,7,12,20,"#2f5fb3","#ffffff",652),n.box(14,13,11,18,15,14,E("#d8dde3")),n.box(15,15,12,17,16,13,be("#4a8bff")),Ei(n,6,8,13,9),Yt(n,22,13,8),Yt(n,22,13,13),ep(n,28,24,0,12,"#2f5fb3","#f4f4f0"),Rt(n,3,21,0,6,1,1,653);let i=[{mesh:np(),x:6,z:26,rot:0},{mesh:np(),x:24,z:26.5,rot:0}];return{g:n,props:i}}function GS(){let n=Wn(2,38),e=Ut("#c94b3d",1,.94);n.box(3,0,6,24,15,22,e),n.box(3,8,6,24,9,22,E("#f4f1ea")),Sn(n,3,6,24,22,15,E("#f4f1ea")),Ke(n,3,6,24,22,{y0:9,floors:1,floorH:6,sill:1,h:3,w:2,pitch:3,style:"home",seed:660});for(let i of[4,11,18])ri(n,0,i,i+5,0,7,21,"#e9ecef"),st(n,0,i,i+5,6,7,21,be("#fff0c8"));us(n,7,20,9,14,22,"#f4f1ea","#ff5a4a",661),n.box(4,15,9,6,16,11,E(ue.metal)),n.set(5,16,10,be("#ff3b3b")),n.box(24,0,6,30,34,12,e);for(let i=4;i<30;i+=6)n.box(26,i,11,28,i+3,12,be("#ffd98e"));Wr(n,24,6,30,12,34,E("#5a6270"),{overhang:1}),n.box(29,0,26,30,2,27,E("#e0504a")),n.set(29,2,26,E("#f4f1ea"));let t=[{mesh:Ex(),x:13.5,z:25.8,rot:0}];return{g:n,props:t}}function VS(){let n=Wn(2,22),e=We("#f7f7f4",{seed:670,cell:[6,3,6],dark:.2});n.box(4,0,7,28,11,23,e),n.box(4,0,7,28,1,23,E("#a9b4b0")),n.box(4,5,7,28,6,23,E("#5cc8a8")),Sn(n,4,7,28,23,11,E("#5cc8a8")),Ke(n,4,7,28,23,{y0:0,floors:2,floorH:5,sill:1,h:3,w:3,pitch:4,style:"office",seed:671,skip:(i,s,r)=>i===0&&r===0&&s>=10&&s<=18}),st(n,0,12,18,0,4,22,be("#eaf6ff")),n.box(10,4,23,20,5,27,E("#5cc8a8"));let t=E("#e0504a");return n.box(23,6,23,26,11,24,E("#fbfbf8")),n.box(24,7,23,25,10,24,t),n.box(23,8,23,26,9,24,t),tp(n,12,11,13,8,6,2),n.box(13,11,11,14,12,13,E(ue.darkMetal)),Yt(n,22,11,10),Rt(n,4,24,0,5,2,1,672),Yi(n,22,26,0,"x"),{g:n,props:[{mesh:fh(),x:6,z:27.5,rot:0}]}}function WS(){let n=Wn(2,26),e=Ut("#d0704f",1,.95),t=We("#56607a",{seed:680,cell:[3,1,1]});n.box(2,0,3,29,10,12,e),n.box(2,0,12,11,10,22,e),n.box(2,5,3,29,6,12,E("#f1e3c6")),n.box(2,5,12,11,6,22,E("#f1e3c6")),Ke(n,2,3,29,12,{y0:0,floors:2,floorH:5,sill:1,h:3,w:2,pitch:3,style:"office",seed:681,faces:14}),Ke(n,11,3,29,12,{y0:0,floors:2,floorH:5,sill:1,h:3,w:2,pitch:3,style:"office",seed:682,faces:1,skip:(o,a,l)=>l===0&&a>=17&&a<=20}),Ke(n,2,12,11,22,{y0:0,floors:2,floorH:5,sill:1,h:3,w:2,pitch:3,style:"office",seed:683,faces:11}),Un(n,2,3,29,12,10,"x",t,e,{ridge:E("#48506a")}),Un(n,2,12,11,22,10,"z",t,e,{ridge:E("#48506a")}),oi(n,18,2,0,4,11,"#3d5a80"),n.box(16,0,9,22,18,13,e),st(n,0,18,20,0,4,12,E("#3d5a80")),n.box(17,12,13,21,16,14,E("#fbfbf8")),n.set(19,14,13,E(ue.black)),n.set(19,15,13,E(ue.black)),n.set(20,14,13,E(ue.black)),Wr(n,16,9,22,13,18,E("#48506a"),{overhang:1});let i=E("#e0504a"),s=E("#f5c542"),r=E("#3d7be0");n.box(14,0,16,18,1,20,E("#f2d58a")),n.box(14,0,16,18,1,17,E("#b38b5a"));for(let o of[21,27])n.box(o,0,16,o+1,5,17,r);n.box(21,5,16,28,6,17,r),n.box(23,2,16,24,3,17,i),n.box(25,2,16,26,3,17,s),n.box(22,0,24,24,5,26,s);for(let o=0;o<4;o++)n.box(24+o,4-o,24,25+o,5-o,26,i);return ep(n,13,13,0,14,"#3d7be0","#f5c542"),Wi(n,29,29,0,684,2,"#5db84a"),{g:n,props:[{mesh:Tx(),x:7.5,z:27.5,rot:1}]}}function XS(){let n=Wn(3,56),e=We("#f6f7f5",{seed:690,cell:[8,5,8],dark:.25,dk:.95}),t=E("#5cc8a8");n.box(10,0,8,38,45,26,e),ml(n,10,8,38,26,10,7,5,3,"office",691,2,1);for(let r=2;r<9;r++)n.box(10,r*5,8,38,r*5+1,26,E("#e8ece9"));n.box(10,44,8,38,45,26,t),De(n,24,17,8.2,45,46,E("#f5c542")),De(n,24,17,7.2,45,46,E("#4a4f58"));let i=E("#fbfbf8");n.box(20,45,13,22,46,21,i),n.box(26,45,13,28,46,21,i),n.box(22,45,16,26,46,18,i);for(let[r,o]of[[11,9],[36,9],[11,24],[36,24]])n.set(r,45,o,be("#7ff38a"));tp(n,30,34,26,7,7,1),n.box(4,0,26,44,10,41,e),n.box(4,0,26,44,1,41,E("#a9b4b0")),n.box(4,9,26,44,10,41,t),Ke(n,4,26,44,41,{y0:0,floors:2,floorH:5,sill:1,h:3,w:3,pitch:4,style:"office",seed:692,skip:(r,o,a)=>r===0&&a===0&&o>=16&&o<=30}),st(n,0,18,30,0,4,40,be("#eaf6ff")),n.box(16,4,41,32,5,46,E("#e0504a"));for(let r of[16,31])n.box(r,0,45,r+1,4,46,E("#f4f4f0"));us(n,18,30,5,10,41,"#e0504a","#ffffff",693),Yt(n,6,10,28),Yt(n,40,10,28),Rt(n,4,42,0,10,2,1,694),Rt(n,34,42,0,10,2,1,695);let s=[{mesh:fh(),x:20,z:43.5,rot:0},{mesh:fh(),x:27,z:43.5,rot:0}];return{g:n,props:s}}function YS(){let n=Wn(3,36),e=We("#f1e7d2",{seed:700,cell:[4,2,4],dark:.18});n.box(6,0,4,42,14,20,e),n.box(6,0,4,42,1,20,E("#c9bca2")),n.box(5,13,3,43,14,21,E("#fbf6ea")),Ke(n,6,4,42,20,{y0:0,floors:2,floorH:6,sill:2,h:4,w:2,pitch:4,style:"office",seed:701,skip:(t,i)=>t===0&&i>=15&&i<=32});for(let t of[2,42])n.box(t,0,6,t+4,10,18,e),Wr(n,t,6,t+4,18,10,E("#8a7f74"),{overhang:0});n.box(15,0,20,33,1,27,E("#e4d9c2"));for(let t=16;t<33;t+=3)n.box(t,1,24,t+1,11,25,E("#fbf6ea"));n.box(15,11,20,33,13,26,E("#fbf6ea")),Un(n,15,20,33,26,13,"z",E("#e4d9c2"),E("#fbf6ea"),{overhang:0}),st(n,0,21,27,1,8,19,be("#ffe2a8")),De(n,24,12,6,14,18,e),Xr(n,24,12,6,14,1,4,1,2,"office",702,10),hh(n,24,18,12,6.5,6,6.5,We("#5fb3a0",{seed:703,cell:[2,1,2]}),!0),n.box(23,24,11,25,27,13,E("#fbf6ea")),n.set(24,27,12,be("#ffe9b0")),n.box(8,0,28,40,1,46,We("#7cc95a",{seed:704,cell:[3,1,3],dark:.2})),n.box(8,0,36,40,1,38,E("#e4d9c2")),n.box(23,0,27,25,1,46,E("#e4d9c2"));for(let[t,i]of[[11,31],[36,31],[11,42],[36,42]])Wi(n,t,i,1,705+t,2,t<20?"#5db84a":"#62b85a");return Yi(n,17,35,1,"x"),Yi(n,29,35,1,"x"),gi(n,22,39,1,5),gi(n,25,34,1,5),{g:n}}function qS(){let n=Wn(4,44),e=32,t=32,i=30.5,s=27,r=2.6,o=.6,a=E("#3d7be0"),l=E("#f4f4f0"),c=E("#e0504a"),u=E("#d8d3c8"),d=E("#bdb6a8");for(let _=0;_<64;_++)for(let M=0;M<64;M++){let A=Math.abs(M+.5-e)/i,v=Math.abs(_+.5-t)/s,S=Math.pow(Math.pow(A,r)+Math.pow(v,r),1/r);if(S>1||S<o)continue;let C=(S-o)/(1-o),P=Math.min(7,Math.floor(C*8)),D=2+P*2;if(C>.93){n.box(M,0,_,M+1,D+2,_+1,u);continue}n.box(M,0,_,M+1,D-1,_+1,d);let N=Math.atan2(_+.5-t,M+.5-e),I=Math.floor((N/(Math.PI*2)+1)%1*10);n.set(M,D-1,_,I%2===0?P%2?a:l:P%2?c:l)}for(let _=0;_<64;_++)for(let M=0;M<64;M++)for(let A=1;A<5;A++){if(!n.get(M,A,_)||n.get(M,18,_)===0)continue;(!n.get(M+1,A,_)||!n.get(M-1,A,_)||!n.get(M,A,_+1)||!n.get(M,A,_-1))&&(M+_)%4<2&&n.set(M,A,_,E("#7d7568"))}let h=E("#5cbf4a"),f=E("#4fae42"),p=E("#fbfbf8"),x=17,g=47,m=21,b=43;n.box(x-2,0,m-2,g+2,1,b+2,E("#c9875a")),n.box(x,0,m,g,1,b,_=>Math.floor((_-x)/3)%2?h:f),n.box(x,0,m,g,1,m+1,p),n.box(x,0,b-1,g,1,b,p),n.box(x,0,m,x+1,1,b,p),n.box(g-1,0,m,g,1,b,p),n.box(31,0,m,33,1,b,p);for(let _=0;_<24;_++){let M=_/24*Math.PI*2;n.set(Math.floor(32+Math.cos(M)*4.5),0,Math.floor(32+Math.sin(M)*4.5),p)}for(let _ of[x,g-3])n.box(_,1,30,_+3,3,34,p);let w=E("#f4f4f0");for(let _=4;_<16;_++)for(let M=10;M<54;M++){let A=Math.abs(M+.5-e)/i,v=Math.abs(_+.5-t)/s,S=Math.pow(Math.pow(A,r)+Math.pow(v,r),1/r);S>.78&&S<=1&&n.set(M,21,_,w)}for(let _ of[14,32,50])n.box(_,18,6,_+1,21,7,E(ue.steel));let y=E("#8f99a6");for(let[_,M]of[[6,6],[57,6],[6,57],[57,57]]){n.box(_,0,M,_+1,38,M+1,y);let A=_<32?1:-1,v=M<32?1:-1;n.box(Math.min(_,_+A*3),38,Math.min(M,M+v*3),Math.max(_,_+A*3)+1,41,Math.max(M,M+v*3)+1,E("#5a6270"));for(let S=0;S<=3;S++)n.set(_+A*S,39,M+v*(3-S),be("#f6f9ff")),n.set(_+A*S,40,M+v*(3-S),be("#f6f9ff"))}return n.box(26,0,57,38,12,60,u),n.box(28,0,59,36,7,60,0),st(n,0,28,36,0,6,58,be("#ffe6a8")),us(n,25,39,12,17,59,"#3d7be0","#ffffff",710),{g:n}}function $S(){let n=Wn(2,184),e=16,t=16,i=Ut("#f4f4f0",8,.96);De(n,e,t,12.5,0,2,E("#d8d3c8")),De(n,e,t,5,2,6,E("#e9edf2")),st(n,0,13,19,2,5,20,be("#eaf6ff"));for(let s=2;s<30;s++){let r=Math.round(9*Math.pow(1-s/30,1.3));for(let[o,a]of[[-1,-1],[1,-1],[-1,1],[1,1]]){let l=e+o*r-(o>0?2:0),c=t+a*r-(a>0?2:0);n.box(l,s,c,l+2,s+1,c+2,E("#e4e8ee"))}}De(n,e,t,3.2,20,130,i);for(let s=36;s<126;s+=15)De(n,e,t,4.2,s,s+1,be("#8ff0ff")),De(n,e,t,4.2,s+1,s+2,E("#cfe9ee"));n.box(7,128,7,25,130,25,E("#e4e8ee")),n.box(8,130,8,24,146,24,E("#f4f4f0")),Ke(n,8,8,24,24,{y0:130,floors:3,floorH:5,sill:1,h:4,w:3,pitch:4,margin:1,style:"tower",seed:720,litShare:.85}),n.box(7,146,7,25,147,25,E("#5fd0d8")),n.box(9,147,9,23,149,23,E("#e4e8ee")),n.box(11,149,11,21,157,21,E("#f4f4f0")),Ke(n,11,11,21,21,{y0:149,floors:1,floorH:8,sill:2,h:4,w:2,pitch:3,margin:1,style:"tower",seed:721,litShare:.9}),n.box(12,157,12,20,158,20,E("#5fd0d8")),n.box(14,158,14,18,164,18,E("#e4e8ee")),n.box(15,164,15,17,178,17,E("#dfe6ee")),n.box(15,178,15,16,182,16,E("#c9d0d8")),n.set(15,182,15,be("#ff4a3a"));for(let[s,r]of[[7,7],[24,7],[7,24],[24,24]])n.set(s,146,r,be("#ffe9b0"));return{g:n}}var ZS={power_coal:DS,power_wind:NS,power_solar:US,water_tower:OS,water_pump:FS,park_small:BS,park_plaza:zS,police:HS,fire:GS,clinic:VS,school:WS,hospital:XS,college:YS,stadium:qS,landmark:$S};function Ax(n){let e=ZS[n];if(e)return e();let t=(nt[n]?.size??1)*16,i=new rn(t,12,t);return i.box(2,0,2,t-2,10,t-2,E(ue.concrete)),{g:i}}function Rx(n){let e=n.g,t=bx(e),i=e.nx/2,s=e.nz/2,r=e.topY()/xi;for(let l of n.props??[])t.append(l.mesh,(l.x-i)/xi,(l.y??0)/xi,(l.z-s)/xi,l.rot),l.h!==void 0&&(r=Math.max(r,(l.y??0)/xi+l.h));let o=t.toGeometries(),a={body:o.body,glow:o.glow,height:r,triangles:t.triangles};if(n.smoke&&n.smoke.length&&(a.smoke=n.smoke.map(([l,c,u])=>new Z((l-i)/xi,c/xi,(u-s)/xi))),n.spinner){let l=n.spinner,c=l.mesh.toGeometries(),u=new Z((l.at[0]-i)/xi,l.at[1]/xi,(l.at[2]-s)/xi);a.spinner={geometry:c.body,pivot:u,axis:l.axis,speed:l.speed},a.triangles+=l.mesh.triangles,r=Math.max(r,u.y+l.reach),a.height=r}return a}var ph=["#5db84a","#4fae4c","#73c44f","#62b85a"];function mh(n,e,t,i,s,r){let o=i+1+s%2;n.box(e,0,t,e+1,o,t+1,E(ue.trunk,.95+s%3*.04)),jf(n,e,t,o,i,i+2,r,s)}function Cx(n){let e=new rn(16,16,16),t=Math.max(1,Math.min(3,n|0));if(t===1)mh(e,5,5,3,11,ph[0]),mh(e,11,10,2,12,ph[2]),mh(e,4,12,2,13,ph[1]);else if(t===2)Ps(e,5,5,0,21,10,ue.pine),Ps(e,11,9,0,22,8,"#2a7d4f"),Ps(e,5,12,0,23,7,"#3a945c");else{mh(e,10,5,3,31,ph[3]),Ps(e,4,9,0,32,9,ue.pine),Rt(e,9,11,0,3,2,2,33,"#4aa647"),Rt(e,12,12,0,2,2,1,34,"#5cb84e");let i=["#ffd84a","#ffffff","#ff8fb0"];for(let s=0;s<4;s++){let r=2+Math.floor(ve(s,3,35)*12),o=2+Math.floor(ve(s,4,35)*12);e.get(r,0,o)===0&&e.set(r,0,o,E(i[s%i.length]))}}return e}function Ai(n){return new rn(16,n,16)}function Px(n,e,t,i){n.box(e,0,t,e+1,1,t+1,E(ue.wood)),n.box(e,1,t,e+1,3,t+1,E(ue.frame)),n.box(e-1,3,t-1,e+2,4,t+2,E(i)),n.set(e,4,t,E(i,.9))}function ip(n,e,t,i,s,r,o){st(n,0,e,t,1,1+s,i,be("#ffe2a0")),st(n,0,r,r+2,0,4,i,E(o))}function KS(){let n=Ai(15),e=We("#f7c9a4",{seed:200});return n.box(2,0,3,14,8,11,e),n.box(2,0,3,14,1,11,E("#a9826a")),ip(n,3,13,10,4,7,"#6a3d2a"),Ke(n,2,3,14,11,{y0:0,floors:1,floorH:8,sill:2,h:3,w:2,pitch:4,style:"shop",seed:201,faces:14}),n.box(1,8,2,15,9,12,E("#fff3e4")),us(n,3,13,9,14,10,"#6a3d2a","#ffd27a",202),dh(n,3,13,6,11,2,uh("#e5483f","#fff6ec","x")),Px(n,3,13,"#e5483f"),Px(n,12,13,"#2fb3a6"),n.box(6,0,12,7,1,13,E("#3e8f4a")),n.box(9,0,12,10,1,13,E("#3e8f4a")),n.box(6,1,12,7,2,13,We(ue.hedge,{seed:203,cell:[1,1,1]})),n.box(9,1,12,10,2,13,We(ue.hedge,{seed:204,cell:[1,1,1]})),Yt(n,4,8,4),{g:n}}function JS(){let n=Ai(19),e=We("#f1ede2",{seed:210});n.box(2,0,2,13,11,11,e),n.box(2,0,2,13,1,11,E("#7d8a6a")),ip(n,3,12,10,4,7,"#2f6f45"),Ke(n,2,2,13,11,{y0:6,floors:1,floorH:5,sill:1,h:3,w:2,pitch:3,style:"home",seed:211}),Ke(n,2,2,13,11,{y0:0,floors:1,floorH:6,sill:2,h:3,w:2,pitch:4,style:"shop",seed:212,faces:2}),dh(n,2,13,5,11,2,uh("#3f9a4f","#e8f5e0","x")),Sn(n,2,2,13,11,11,E("#d9d2c2")),n.box(5,12,6,6,13,7,E(ue.darkMetal)),n.box(10,12,6,11,13,7,E(ue.darkMetal)),us(n,3,13,13,18,6,"#3f9a4f","#fff2c0",213);let t=["#e5483f","#f5a623","#f5d742","#7ac943"];for(let i=0;i<4;i++){let s=i<2?3+i*2:9+(i-2)*2;n.box(s,0,12,s+2,1,13,E(ue.wood)),n.box(s,1,12,s+2,2,13,E(t[i]))}return Yt(n,13,2,4,1,2),Rt(n,13,12,0,2,2,1,214),{g:n}}function jS(){let n=Ai(16),e=We("#6cc8c0",{seed:220});n.box(1,0,4,15,6,11,e),n.box(1,0,4,2,6,5,0),n.box(1,0,10,2,6,11,0),n.box(14,0,4,15,6,5,0),n.box(14,0,10,15,6,11,0),n.paintSolid(0,1,0,16,2,16,E("#e8edf2"));for(let t=1;t<15;t++)for(let i=4;i<11;i++)for(let s=2;s<4;s++)n.get(t,s,i)!==0&&(n.get(t+1,s,i)&&n.get(t-1,s,i)&&n.get(t,s,i+1)&&n.get(t,s,i-1)||n.set(t,s,i,Vr("shop",ve(Math.floor(t/2),i,221))));return st(n,0,7,9,0,4,10,E("#c33f3a")),n.box(1,6,4,15,7,11,E("#f4f1ea")),n.box(2,6,5,14,7,10,E("#e5483f")),n.box(4,7,7,5,9,8,E(ue.darkMetal)),n.box(11,7,7,12,9,8,E(ue.darkMetal)),us(n,3,13,9,14,7,"#e5483f","#fff2a8",222),n.box(7,14,7,9,15,8,be("#ffd84a")),{g:n,props:[{mesh:br(2),x:12.5,z:13.3,rot:1}]}}function QS(){let n=Ai(16),e=Ut("#c98a6a",1,.94),t=We("#c9b6e4",{seed:230});return n.box(3,0,3,13,6,12,e),n.box(3,6,3,13,12,12,t),n.box(2,6,2,14,7,13,E(ue.frame)),n.box(3,12,3,13,13,12,E("#a9aeb6")),Sn(n,2,2,14,13,12,E(ue.frame),2),ip(n,4,12,11,4,9,"#2f4f7a"),Ke(n,3,3,13,12,{y0:7,floors:1,floorH:5,sill:1,h:3,w:2,pitch:3,style:"home",seed:231}),dh(n,3,13,5,12,2,uh("#3d7be0","#eef4ff","x")),n.box(13,8,12,14,11,13,E("#3d7be0")),n.set(13,9,13,be("#ffe6a8")),Yt(n,4,13,4),Yt(n,8,13,4),n.box(10,13,8,11,15,9,E(ue.metal)),n.box(9,15,7,12,16,10,E("#f4f4f0")),Rt(n,2,13,0,1,1,2,232),Rt(n,13,13,0,1,1,2,233),gi(n,2,14,0,5),{g:n}}function eT(){let n=Ai(32),e=5,t=5,i=We("#eeeeea",{seed:240,cell:[12,5,12],dark:.3,dk:.95});return n.box(2,0,2,14,e*t+1,14,i),ml(n,2,2,14,14,0,e,t,3,"office",241,2,1),n.box(5,4,14,11,5,16,E("#3a6fb8")),st(n,0,6,10,0,4,13,be("#fff0c8")),Sn(n,2,2,14,14,e*t+1,E("#d6d6d0")),n.box(4,26,4,8,29,8,E("#d6d6d0")),n.box(4,28,4,8,29,8,E("#3a6fb8")),Yt(n,10,26,4),Yt(n,10,26,8),Yt(n,5,26,10),Rt(n,1,14,0,2,1,1,242),Rt(n,13,14,0,2,1,1,243),{g:n}}function tT(){let n=Ai(26),e=We("#ecdcc6",{seed:250,cell:[4,3,4]});n.box(1,0,2,15,18,13,e),n.box(1,0,2,15,1,13,E("#a8957c")),n.box(1,12,2,15,13,13,E("#f08a3c")),Ke(n,1,2,15,13,{y0:0,floors:2,floorH:6,sill:1,h:4,w:3,pitch:4,style:"shop",seed:251,faces:14}),n.box(4,0,13,12,16,15,E("#e8e4dc"));for(let t=1;t<15;t++)for(let i=5;i<11;i++)n.set(i,t,14,t%5===0?E("#cfd5dc"):Vr("shop",ve(i,Math.floor(t/5),252),.95));st(n,0,7,9,0,4,14,E("#2f3b4a")),n.box(3,4,15,13,5,16,E("#f08a3c")),us(n,3,13,16,21,14,"#f08a3c","#fff6dc",253);for(let t of[3,8])n.box(t,18,4,t+4,19,11,E("#d8d0c2")),n.box(t+1,19,5,t+3,20,10,be("#e8f0ff"));return Yt(n,12,18,4),Yt(n,12,18,8),{g:n}}function nT(){let n=Ai(36),e=6,t=5,i=We("#d9dde3",{seed:260,cell:[10,5,10],dark:.3,dk:.95});n.box(3,0,3,13,e*t+1,13,i),n.box(3,0,3,13,5,13,E("#5a6270")),Ke(n,3,3,13,13,{y0:5,floors:e-1,floorH:t,sill:1,h:3,w:2,pitch:3,style:"office",seed:261}),st(n,0,4,12,1,4,12,be("#fff1cc"));for(let s=5;s<e*t;s++){let r=Vr("office",ve(Math.floor(s/t),3,262));n.set(12,s,12,r)}return n.box(2,4,2,14,5,14,E("#5a6270")),Sn(n,3,3,13,13,e*t+1,E("#5a6270")),n.box(4,31,4,7,34,7,E("#b9bec6")),Yt(n,9,31,4),Yt(n,9,31,8),Ei(n,5,9,31,4),gi(n,2,14,0,5),gi(n,13,14,0,5),{g:n}}function iT(){let n=Ai(36),e=6,t=5,i=We("#f2e6d0",{seed:270,cell:[12,5,12],dark:.3,dk:.95});n.box(2,0,4,14,e*t+1,12,i),n.box(2,0,4,14,5,12,E("#8a4b5e")),Ke(n,2,4,14,12,{y0:5,floors:e-1,floorH:t,sill:1,h:3,w:2,pitch:3,style:"home",seed:271}),st(n,0,4,12,1,4,11,be("#ffd890")),st(n,0,7,9,0,4,11,E("#3a2630"));for(let s of[2,13])n.box(s,5,12,s+1,e*t+1,13,E("#c95b6e"));n.box(5,4,12,11,5,15,E("#c95b6e")),n.set(5,3,14,be(si)),n.set(10,3,14,be(si)),n.box(14,8,10,15,28,12,E("#c95b6e"));for(let s=9;s<27;s++)s%3!==0&&n.set(14,s,11,be("#ffe1ef"));return Sn(n,2,4,14,12,e*t+1,E("#c95b6e")),n.box(5,32,6,6,34,7,E(ue.frame)),n.box(4,34,5,7,35,8,E("#2fb3a6")),n.box(10,32,8,11,34,9,E(ue.frame)),n.box(9,34,7,12,35,10,E("#f5c542")),Rt(n,1,13,0,1,2,2,272),Rt(n,14,13,0,1,2,2,273),{g:n}}function sT(){let n=Ai(96),e=5,t=14,i=E("#cdd7e3");n.box(3,0,3,13,t*e+2,13,i),Ke(n,3,3,13,13,{y0:0,floors:t,floorH:e,sill:0,h:4,w:2,pitch:3,margin:0,style:"office",seed:300}),n.box(2,0,2,14,4,14,E("#4d5f78")),st(n,0,4,12,0,3,13,be("#fff0c8"));let s=t*e+2;return n.box(4,s,4,12,s+3,12,i),Ke(n,4,4,12,12,{y0:s,floors:1,floorH:3,sill:0,h:2,w:2,pitch:2,margin:0,style:"office",seed:301}),n.box(5,s+3,5,11,s+5,11,E("#9fb0c4")),n.box(6,s+5,6,10,s+7,10,E("#b8c6d6")),n.box(7,s+7,7,9,s+10,9,E("#dfe6ee")),Ei(n,7,7,s+10,8),{g:n}}function rT(){let n=Ai(92),e=5,t=We("#efe4cf",{seed:310,cell:[12,5,12],dark:.3,dk:.95}),i=[[2,0,6],[3,6,11],[4,11,15]];for(let[r,o,a]of i)n.box(r,o*e,r,16-r,a*e,16-r,t),Ke(n,r,r,16-r,16-r,{y0:o*e,floors:a-o,floorH:e,sill:0,h:4,w:1,pitch:2,style:"tower",seed:311+o}),n.box(r,a*e-1,r,16-r,a*e,16-r,E("#d9b44a"));st(n,0,5,11,0,4,13,be("#ffd98a"));let s=15*e;n.box(5,s,5,11,s+3,11,E("#d9b44a"));for(let r=5;r<11;r+=2)n.set(r,s+1,10,be("#ffe9b0")),n.set(r,s+1,5,be("#ffe9b0")),n.set(10,s+1,r,be("#ffe9b0")),n.set(5,s+1,r,be("#ffe9b0"));return n.box(6,s+3,6,10,s+6,10,E("#e8cf7a")),n.box(7,s+6,7,9,s+9,9,E("#d9b44a")),Ei(n,7,8,s+9,6,"#ff5a4a"),{g:n}}function oT(){let n=Ai(86),e=5,t=15,i=E("#2a6f73");n.box(3,0,4,13,t*e,12,i),ml(n,3,4,13,12,0,t,e,4,"office",320,2,0);for(let s=4;s<12;s++){let r=(s-4)*2;n.box(3,t*e-r,s,13,t*e,s+1,0),n.box(3,t*e-r-1,s,13,t*e-r,s+1,E("#d5e7e6"))}return n.box(2,0,3,14,4,13,E("#cfd8d8")),st(n,0,4,12,0,3,12,be("#fff1cc")),Ei(n,4,4,t*e,6),Ei(n,11,4,t*e,4),{g:n}}function aT(){let n=Ai(88),e=5,t=15;De(n,8,8,5.7,0,t*e,E("#2f3d52")),Xr(n,8,8,5.7,0,t,e,0,4,"office",330,16,.2);for(let s=3;s<t;s+=3)De(n,8,8,6.2,s*e,s*e+1,E("#d9b44a"));let i=t*e;return De(n,8,8,6.2,i,i+2,E("#d9b44a")),Xr(n,8,8,6.2,i,1,2,0,1,"tower",331,24,0),De(n,8,8,5.2,i+2,i+3,E("#3e4a5c")),n.box(6,i+3,7,10,i+4,9,E("#f5c542")),n.box(7,i+3,6,9,i+4,10,E("#f5c542")),n.box(2,0,2,14,3,14,E("#c9ced6")),st(n,0,4,12,0,3,13,be("#fff0c8")),Rt(n,2,11,3,2,2,1,332),Rt(n,12,11,3,2,2,1,333),{g:n}}function Ix(n,e){return n===1?[KS,JS,jS,QS][e]():n===2?[eT,tT,nT,iT][e]():[sT,rT,oT,aT][e]()}function Ri(n){return new rn(16,n,16)}function sp(n,e,t,i,s,r){return n.box(e,s,t,e+i,r,t+i,Ut(ue.brick,2,.92)),n.box(e,r-1,t,e+i,r,t+i,E("#4a4d55")),[e+i/2,r,t+i/2]}function lT(n,e,t,i,s,r,o,a){let l=E(a),c=E(a,.9);for(let u=t;u<s;u+=o){for(let h=0;h<o&&u+h<s;h++){let f=h+1;n.box(e,r,u+h,i,r+f,u+h+1,h%2?c:l)}let d=Math.min(s-1,u+o-1);for(let h=e+1;h<i-1;h++)for(let f=r+1;f<r+o;f++)n.get(h,f,d)&&!n.get(h,f,d+1)&&n.set(h,f,d,be("#ffe6a0",ve(h,f,u)<.5?1:.8))}}function cT(){let n=Ri(12),e=Gr("#c5ced8","x",1,.93),t=Gr("#c5ced8","z",1,.93);n.box(2,0,2,14,7,10,e),n.box(2,0,2,3,7,10,t),n.box(13,0,2,14,7,10,t);let i=E("#8d99a8");return n.box(2,7,3,14,8,9,i),n.box(2,8,4,14,9,8,E("#97a3b1")),n.box(2,9,5,14,10,7,E("#a2adba")),n.box(2,7,2,14,8,3,E("#a2adba")),n.box(2,7,9,14,8,10,E("#a2adba")),ri(n,0,3,7,0,5,9,"#f2c94c"),ri(n,0,9,13,0,5,9,"#f2c94c"),Ke(n,2,2,14,10,{y0:0,floors:1,floorH:7,sill:4,h:2,w:2,pitch:3,style:"factory",seed:400,faces:10}),n.set(8,5,10,be("#fff0c0")),xr(n,2,12,0,401),xr(n,12,12,0,402),n.box(6,0,13,9,1,15,E(ue.wood,.9)),{g:n}}function uT(){let n=Ri(16),e=Ut("#b86b4e",1,.94);n.box(3,0,3,13,6,10,e),Un(n,3,3,13,10,6,"x",We("#59636e",{seed:410,cell:[1,1,3]}),e,{ridge:E("#4a535c")}),ri(n,0,4,9,0,5,9,"#d7dbe0"),st(n,0,10,12,0,3,9,E("#3e5e8c")),Ke(n,3,3,13,10,{y0:0,floors:1,floorH:6,sill:2,h:2,w:2,pitch:3,style:"factory",seed:411,faces:14}),n.box(13,0,4,15,4,9,Gr("#9fb08a","z",1,.92)),n.box(13,4,3,16,5,10,E("#6e7a85"));let t=[sp(n,5,5,1,7,12)];return n.box(4,6,10,9,7,11,E("#f5c542")),n.set(9,4,10,be("#fff0c0")),cs(n,2,11,0,"#3d7be0"),cs(n,3,12,0,"#e0504a"),xr(n,11,11,0,412),{g:n,smoke:t}}function hT(){let n=Ri(12),e=Gr("#e2d6b4","x",2,.94);n.box(2,0,1,14,6,7,e),n.box(1,6,0,15,7,8,E("#7c8792")),n.box(2,7,1,14,8,7,E("#8b96a1")),n.box(2,0,7,14,2,9,E(ue.concrete));for(let t of[3,7,11])ri(n,0,t,t+3,2,6,6,"#d65a4a");return n.box(2,2,7,14,3,8,E("#f2c94c")),Ke(n,2,1,14,7,{y0:0,floors:1,floorH:6,sill:3,h:2,w:2,pitch:4,style:"factory",seed:420,faces:10}),gi(n,1,9,0,6),cs(n,14,9,0,"#2fb3a6"),{g:n,props:[{mesh:br(5),x:8.5,z:11.9,rot:0}]}}function dT(){let n=Ri(14),e=E(ue.woodDark);for(let s of[2,7])for(let r of[2,8])n.box(s,0,r,s+1,5,r+1,e);Un(n,2,2,8,9,5,"x",We("#c25b3c",{seed:430,cell:[1,1,3]}),E("#a84a30"),{ridge:E("#a84a30")}),n.box(3,0,3,7,2,8,Gr("#e0b47a","z",1,.9)),n.box(9,0,2,14,5,7,We("#f2c94c",{seed:431})),n.box(9,5,2,14,6,7,E("#5a6270")),Ke(n,9,2,14,7,{y0:0,floors:1,floorH:5,sill:2,h:2,w:2,pitch:3,style:"factory",seed:432}),st(n,0,11,13,0,3,6,E("#5a3a28"));let t=E("#8a5f3c"),i=E("#e2bb86");for(let[s,r]of[[10,1],[12,1],[11,3]])qo(n,"x",s,r,1,2,9,t),n.box(2,r-1,s-1,3,r+1,s+1,i);return cs(n,12,11,0,"#4f9d69"),xr(n,11,12,0,433),sp(n,12,3,1,6,9),{g:n}}function fT(){let n=Ri(30),e=Ut("#c06a4c",1,.94);n.box(1,0,3,15,9,12,e),n.box(1,0,3,15,1,12,E("#6e665e")),n.box(1,8,3,15,9,12,E("#e3d6c0")),lT(n,1,3,15,12,9,3,"#7d8a99"),Ke(n,1,3,15,12,{y0:0,floors:1,floorH:8,sill:3,h:3,w:2,pitch:3,style:"factory",seed:440,faces:10}),ri(n,0,3,8,0,6,11,"#f2c94c"),st(n,0,10,13,1,5,11,be("#ffd98e")),Is(n,[[5,7,12]]);let t=[hs(n,13,2,1.4,0,27,"#b5604a")];return cs(n,1,13,0,"#f2c94c"),cs(n,2,13,0,"#f2c94c"),xr(n,12,13,0,441),{g:n,smoke:t}}function pT(){let n=Ri(34),e=We("#d6dbe0",{seed:450,cell:[4,3,4]});n.box(2,0,3,11,12,10,e),n.box(2,11,3,11,12,10,E("#3d7be0")),Ke(n,2,3,11,10,{y0:0,floors:2,floorH:6,sill:2,h:3,w:2,pitch:3,style:"factory",seed:451}),ri(n,0,3,7,0,5,9,"#3d7be0"),Is(n,[[5,6,10],[9,6,10]]);let t=[hs(n,13,5,1.3,0,30,"#f4f1ea","#e0504a"),hs(n,13,10,1.3,0,25,"#f4f1ea","#e0504a")];return n.box(11,8,5,13,9,6,E(ue.steel)),n.box(11,6,10,13,7,11,E(ue.steel)),De(n,12.5,13,1.8,0,5,E("#e8e4d8")),De(n,12.5,13,1.2,5,6,E("#c9c3b2")),Yt(n,4,12,5),Yt(n,7,12,5),{g:n,smoke:t}}function mT(){let n=Ri(32),e=Gr("#e6dcc4","x",2,.94);n.box(6,0,3,14,9,10,e),Un(n,6,3,14,10,9,"x",E("#6f7c8a"),e,{overhang:0}),ri(n,0,8,12,0,5,9,"#d65a4a"),Is(n,[[10,6,10]]),Ke(n,6,3,14,10,{y0:0,floors:1,floorH:9,sill:5,h:2,w:2,pitch:3,style:"factory",seed:460,faces:10}),De(n,3.5,5.5,2.6,0,22,Ut("#d9dde2",3,.93)),hh(n,3.5,22,5.5,2.6,2,2.6,E("#b9c0c8"),!0);for(let i=0;i<8;i++)n.box(5+i,20-i,5,6+i,21-i,6,E("#f2c94c"));for(let i=0;i<8;i+=2)n.box(5+i,14-i,5,6+i,20-i,6,E(ue.darkMetal));let t=[sp(n,12,4,2,12,18)];return cs(n,2,12,0,"#4f9d69"),cs(n,3,12,0,"#4f9d69"),xr(n,11,12,0,461),{g:n,smoke:t}}function gT(){let n=Ri(30),e=Ut("#a9583f",1,.94);n.box(2,0,3,14,15,10,e),n.box(2,5,3,14,6,10,E("#d9c7a8")),n.box(2,10,3,14,11,10,E("#d9c7a8")),Sn(n,2,3,14,10,15,E("#d9c7a8")),Ke(n,2,3,14,10,{y0:0,floors:3,floorH:5,sill:1,h:3,w:1,pitch:2,style:"factory",seed:470,inset:!0,skip:(s,r,o)=>s===0&&o===0&&r>=6&&r<=9}),ri(n,0,6,10,0,4,9,"#5a6270"),Is(n,[[8,4,10]]);let t=E(ue.darkMetal);for(let[s,r]of[[4,4],[7,4],[4,7],[7,7]])n.box(s,15,r,s+1,18,r+1,t);De(n,6,6,2.4,18,22,E("#7d8a99")),n.box(5,22,5,7,23,7,E("#5a6270"));let i=[hs(n,12,6,1.2,15,27,"#8f4a36")];return xr(n,2,12,0,471),cs(n,13,12,0,"#e0504a"),{g:n,smoke:i}}function xT(){let n=Ri(68);for(let[i,s,r,o,a]of[[4,11.5,3.4,12,"#3d7be0"],[11.5,12,3.2,10,"#f2c94c"]])De(n,i,s,r,0,o,Ut("#eceae2",4,.95)),De(n,i,s,r,o-3,o-2,E(a)),De(n,i,s,r-.9,o,o+1,E("#d4d0c4")),n.box(Math.floor(i),o+1,Math.floor(s),Math.floor(i)+1,o+2,Math.floor(s)+1,E(ue.metalDark));De(n,4.5,4,2.6,0,50,Ut("#d6dbe0",4,.93));for(let i=10;i<48;i+=9)De(n,4.5,4,3.5,i,i+1,E("#f2c94c"));De(n,4.5,4,1.6,50,53,E("#b9c0c8")),De(n,10,4.5,1.9,0,38,Ut("#c9d0d8",4,.93));for(let i=8;i<36;i+=9)De(n,10,4.5,2.8,i,i+1,E("#f2c94c"));n.box(14,0,2,15,62,3,E("#cfd3d8")),n.box(13,58,1,16,59,4,E("#e0504a")),n.set(14,62,2,be("#ffb347")),n.set(14,63,2,be("#ffd56a")),n.box(4,7,4,15,8,5,E(ue.steel)),n.box(4,4,7,5,5,12,E(ue.steel)),n.box(7,5,5,8,6,12,E("#e0504a")),n.box(12,3,6,13,4,10,E(ue.steel)),n.box(7,0,7,10,4,9,E("#f4f1ea")),st(n,0,7,10,1,3,8,be("#e8f0ff"));let e=[];for(let i=10;i<48;i+=9)e.push([1,i+1,4],[8,i+1,4],[4,i+1,0],[4,i+1,7]);for(let i=8;i<36;i+=9)e.push([7,i+1,4],[12,i+1,4]);return Is(n,e),Is(n,[[4,13,11],[11,11,12]],"#ff4436"),{g:n,smoke:[[14.5,64,2.5]]}}function bT(){let n=Ri(72),e=Ut("#e3e0d6",4,.94);for(let[t,i]of[[4.5,4.5],[9.5,4.5],[4.5,9.5],[9.5,9.5]])De(n,t,i,2.5,0,46,e),De(n,t,i,2.5,46,47,E("#b9b5aa"));return n.box(3,47,3,11,52,11,E("#d65a4a")),Ke(n,3,3,11,11,{y0:47,floors:1,floorH:5,sill:1,h:2,w:2,pitch:3,style:"factory",seed:480}),Un(n,3,3,11,11,52,"x",E("#8a3c32"),E("#d65a4a"),{overhang:0}),n.box(12,0,6,15,60,9,Ut("#b9c0c8",5,.93)),Ke(n,12,6,15,9,{y0:2,floors:11,floorH:5,sill:1,h:2,w:1,pitch:2,style:"factory",seed:481,faces:3}),n.box(11,56,6,12,58,9,E(ue.steel)),n.box(12,60,6,15,62,9,E("#8a3c32")),Ei(n,13,7,62,5),Is(n,[[3,47,3],[10,47,3],[3,47,10],[10,47,10],[11,58,7]]),n.box(2,0,12,10,4,15,E("#efe7d2")),n.box(2,4,12,10,5,15,E("#8a3c32")),ri(n,0,4,8,0,3,14,"#d7dbe0"),{g:n}}function yT(){let n=Ri(84),e=Ut("#8d98a5",3,.94);n.box(1,0,6,15,22,14,e),n.box(0,22,5,16,23,15,E("#4a525c")),n.box(3,23,7,13,26,13,E("#565f6a"));for(let i=4;i<13;i+=2)n.set(i,24,13,be("#ffb35c"));Ke(n,1,6,15,14,{y0:0,floors:2,floorH:10,sill:5,h:3,w:2,pitch:3,style:"factory",seed:490,faces:10}),n.box(5,0,14,11,9,15,E("#3a3f47")),st(n,0,6,10,1,7,14,be("#ff8a2a")),n.box(4,9,14,12,10,16,E("#f2c94c")),De(n,5,3,3,0,40,Ut("#8a5a48",4,.92)),De(n,5,3,3.8,18,19,E(ue.darkMetal)),De(n,5,3,2,40,46,E("#5a4a44"));for(let i=0;i<14;i++)n.box(8+Math.floor(i/3),22+i,3,9+Math.floor(i/3),23+i,4,E("#f2c94c"));let t=[hs(n,13,2,1.5,0,82,"#e0504a","#f4f4f0"),[5,46,3]];return Is(n,[[2,14,14],[13,14,14],[2,20,5],[8,37,4]]),xl(n,0,15,4,16,2,"#5c4a3e",491),n.box(12,0,14,15,2,16,E("#f2c94c")),{g:n,smoke:t}}function vT(){let n=Ri(72),e=Ut("#e6e2d8",3,.95),t=48,i=7,s=8;for(let o=0;o<t;o++){let a=o/t,l=a<.7?6.6-2*Math.sin(a/.7*Math.PI*.5):4.6+(a-.7)*3.2;De(n,i,s,l,o,o+1,o>=t-5&&o<t-2?E("#e0504a"):e),De(n,i,s,l-1.3,o,o+1,0)}for(let[o,a]of[[0,-1],[1,0],[0,1],[-1,0]]){let l=Math.floor(i+o*5.6),c=Math.floor(s+a*5.6);n.get(l,t-1,c)&&n.set(l,t-1,c,be("#ff4436"))}for(let o=0;o<12;o++){let a=o/12*Math.PI*2,l=Math.floor(i+Math.cos(a)*6.3),c=Math.floor(s+Math.sin(a)*6.3);n.box(l,0,c,l+1,2,c+1,E("#bdb8ac"))}De(n,i,s,5.4,0,2,0),De(n,i,s,5.4,0,1,E("#6fb6d8"));let r=[[i,t,s],hs(n,14,2.5,1.1,0,70,"#f4f1ea","#e0504a",15)];return n.box(12,0,8,16,12,15,We("#5f8fbf",{seed:500,cell:[3,3,3]})),n.box(12,12,8,16,13,15,E("#4a525c")),Ke(n,12,8,16,15,{y0:0,floors:1,floorH:12,sill:6,h:3,w:1,pitch:2,style:"factory",seed:501,faces:3}),ri(n,0,13,15,0,5,14,"#d7dbe0"),{g:n,smoke:r}}function Lx(n,e){return n===1?[cT,uT,hT,dT][e]():n===2?[fT,pT,mT,gT][e]():[xT,bT,yT,vT][e]()}function Ci(n){return new rn(16,n,16)}function Zo(n,e,t,i,s,r="#c8bea8"){n.box(e,0,t,i,1,s,E(r))}function _T(){let n=Ci(16),e=We("#f6e7c8",{seed:1});n.box(3,0,5,13,6,12,e),Zo(n,3,5,13,12),Ke(n,3,5,13,12,{y0:0,floors:1,floorH:6,sill:2,h:2,w:2,pitch:6,style:"home",seed:11,inset:!0}),oi(n,7,2,1,3,11,ue.door,!1);let t=We("#e0574a",{seed:2,dark:.18,cell:[3,1,1]});return Un(n,3,5,13,12,6,"x",t,e,{ridge:E("#b8443b")}),n.box(10,6,6,12,12,8,We(ue.brick,{seed:3,cell:[1,1,1]})),n.box(10,12,6,12,13,8,E(ue.brickDark)),n.box(6,4,12,10,5,14,E("#c9483e")),n.box(6,0,13,7,4,14,E(ue.frame)),n.box(9,0,13,10,4,14,E(ue.frame)),n.set(8,3,12,be(si)),Xi(n,3,12,6,13,0,4),Xi(n,10,12,13,13,0,5),Qf(n,"x",1,15,14,0,ue.frame,[[6,10]]),Wi(n,2,2,0,6,2,"#5db84a"),Rt(n,13,2,0,2,2,1,7),{g:n}}function MT(){let n=Ci(14),e=We("#d3e6f3",{seed:11});n.box(2,0,4,10,5,11,e),Zo(n,2,4,10,11,"#b9c3cc"),Ke(n,2,4,10,11,{y0:0,floors:1,floorH:5,sill:2,h:2,w:2,pitch:4,style:"home",seed:12,faces:14,inset:!0}),st(n,0,3,5,2,4,10,be("#ffd27a"),!1),oi(n,7,2,1,3,10,ue.doorBlue),Wr(n,2,4,10,11,5,We("#4f73b8",{seed:13,cell:[2,1,2]}),{ridge:E("#3c5a96")}),n.box(10,0,5,14,4,11,We("#e9eef2",{seed:14})),n.box(10,4,5,14,5,11,E("#9aa7b4"));let t=[E("#fbfbf8"),E("#dcdfe2")];return st(n,0,11,13,0,3,10,(i,s)=>t[s%2]),Yt(n,3,0,2,2,2),Rt(n,1,11,0,1,4,1,15),Xi(n,3,11,6,12,0,16),Wi(n,4,1,0,17,1,"#73c44f"),{g:n,props:[{mesh:br(1),x:12,z:13.6,rot:2}]}}function wT(){let n=Ci(18),e=We("#f7e2a0",{seed:21});n.box(4,0,3,12,4,12,e),Zo(n,4,3,12,12);let t=We("#8a63b8",{seed:22,cell:[1,2,3]});Un(n,4,3,12,12,4,"z",t,e,{rise:2,ridge:E("#6c4c96")}),oi(n,7,2,0,3,11,"#8a4b2f"),st(n,0,7,9,6,9,11,be("#ffcf7a")),st(n,2,7,9,6,8,3,be("#ffe0a0")),Ke(n,4,3,12,12,{y0:0,floors:1,floorH:4,sill:1,h:2,w:2,pitch:4,style:"home",seed:23,faces:10}),n.box(9,8,5,11,14,7,We(ue.brick,{seed:24,cell:[1,1,1]})),n.box(9,14,5,11,15,7,E(ue.brickDark)),n.box(12,0,4,15,1,11,E(ue.soil));for(let i=4;i<11;i+=2)n.box(12,1,i,15,2,i+1,We("#6fc04f",{seed:25,cell:[1,1,1]}));return Ps(n,2,5,0,26,8),n.box(10,0,14,11,2,15,E(ue.woodDark)),n.box(10,2,14,11,3,15,E("#4f7bd0")),Rt(n,1,10,0,2,3,1,27),{g:n}}function ST(){let n=Ci(16),e=We("#f6f1e6",{seed:31}),t=We("#cf6b3f",{seed:32,cell:[3,1,1]}),i=E("#a95532");return n.box(2,0,3,13,5,9,e),n.box(2,0,8,7,5,13,e),Zo(n,2,3,13,9),Zo(n,2,8,7,13),Ke(n,2,3,13,9,{y0:0,floors:1,floorH:5,sill:2,h:2,w:2,pitch:4,style:"home",seed:33,faces:14,inset:!0}),Ke(n,2,8,7,13,{y0:0,floors:1,floorH:5,sill:2,h:2,w:2,pitch:4,style:"home",seed:34,faces:9,inset:!0}),st(n,0,10,12,2,4,8,be("#ffc35e"),!0),oi(n,7,2,1,3,8,"#5d7f3a"),Un(n,2,3,13,9,5,"x",t,e,{ridge:i}),Un(n,2,8,7,13,5,"z",t,e,{ridge:i}),n.box(7,3,9,13,4,11,E(ue.wood)),n.box(12,0,10,13,3,11,E(ue.woodDark)),Yi(n,9,10,0,"x"),Wi(n,14,13,0,35,1,"#62b85a"),n.box(9,0,13,11,2,15,E("#c2884f")),n.box(9,2,13,11,3,15,E("#b5463c")),n.set(10,0,15,0),Xi(n,1,13,7,14,0,36),{g:n}}function TT(){let n=Ci(24),e=["#e8a3a0","#f2d28a","#9fcbe3"],t=["#7a5560","#6e6a5a","#4f6382"];for(let i=0;i<3;i++){let s=2+i*4,r=s+4,o=We(e[i],{seed:40+i,cell:[2,1,2]}),a=15+(i===1?2:0);n.box(s,0,4,r,a,12,o),Zo(n,s,4,r,12,"#b7ad9c"),n.box(s,a-1,4,r,a,13,E(ue.frame)),Un(n,s,4,r,12,a,"z",E(t[i]),o,{overhang:0,rise:2}),Ke(n,s,4,r,12,{y0:0,floors:3,floorH:5,sill:2,h:3,w:2,pitch:3,style:"home",seed:44+i,faces:5,skip:(l,c,u)=>l===0&&u===0}),oi(n,s+1,2,1,3,11,["#5b3a6a","#2f6f6a","#8a3a33"][i]),n.box(s+1,0,12,s+3,1,14,E("#cfc6b6")),Xi(n,s+1,12,s+3,13,6,47+i)}return Ke(n,2,4,14,12,{y0:0,floors:3,floorH:5,sill:2,h:2,w:2,pitch:4,style:"home",seed:49,faces:10}),n.box(5,15,6,7,21,8,We(ue.brick,{seed:50,cell:[1,1,1]})),Rt(n,2,13,0,1,1,1,51),Rt(n,13,13,0,1,1,1,52),{g:n}}function ET(){let n=Ci(30),e=Ut(ue.brick,1,.95);n.box(2,0,3,14,20,13,e),n.box(2,0,3,14,1,13,E("#8f8577"));for(let t=1;t<4;t++)n.box(2,t*5,3,14,t*5+1,13,E("#e3d6c0"));Sn(n,2,3,14,13,20,E("#e3d6c0")),Ke(n,2,3,14,13,{y0:0,floors:4,floorH:5,sill:1,h:3,w:2,pitch:3,style:"home",seed:60,inset:!0,skip:(t,i,s)=>t===0&&s===0&&i>=6&&i<=9}),oi(n,7,2,1,4,12,"#3a3f4a",!1),n.box(6,4,13,10,5,15,E("#2f6f6a")),n.set(8,3,13,be(si));for(let t=1;t<4;t++)for(let i of[3,10])n.box(i,t*5,13,i+3,t*5+1,15,E("#d8cbb5")),n.box(i,t*5+1,14,i+3,t*5+2,15,E(ue.darkMetal));return px(n,9,5,20),Yt(n,4,20,5),Yt(n,4,20,9),n.box(12,20,10,13,22,12,E(ue.concreteDark)),{g:n}}function AT(){let n=Ci(30),e=We("#f3f1ec",{seed:70,cell:[3,5,3],dark:.12,dk:.95});n.box(3,0,3,13,25,13,e),n.box(3,0,3,13,1,13,E("#a7a39b")),Ke(n,3,3,13,13,{y0:0,floors:5,floorH:5,sill:1,h:3,w:3,pitch:4,margin:1,style:"home",seed:71});for(let t=1;t<5;t++){let i=t%2?E("#2fb3a6"):E("#c98b5a");n.box(4,t*5,13,12,t*5+1,15,E("#dedbd4")),n.box(4,t*5+1,14,12,t*5+2,15,i)}return st(n,0,6,10,1,4,12,be("#ffe6a8")),n.box(5,4,13,11,5,15,E("#3b3f47")),Sn(n,3,3,13,13,25,E("#dedbd4")),mx(n,4,4,8,9,25),gl(n,8,8,12,12,25,72),Rt(n,2,13,0,1,2,1,73),Rt(n,13,13,0,1,2,1,74),{g:n}}function RT(){let n=Ci(26),e=We("#efe3cc",{seed:80,cell:[2,1,2]});n.box(2,0,4,14,15,12,e),n.box(2,0,4,14,1,12,E("#b3a68e")),n.box(2,5,4,14,6,12,E("#e2d3b8")),n.box(1,14,3,15,15,13,E(ue.frame)),Ke(n,2,4,14,12,{y0:0,floors:3,floorH:5,sill:1,h:3,w:2,pitch:3,style:"home",seed:81,inset:!0,skip:(i,s,r)=>i===0&&r===0&&s>=6&&s<=8}),oi(n,7,2,1,4,11,"#2c4a6e"),n.box(6,0,12,10,1,14,E("#cfc6b6"));let t=We("#5a6680",{seed:82,cell:[1,2,1]});Wr(n,2,4,14,12,15,t,{overhang:0,rise:3,ridge:E("#48526a")});for(let i of[4,7,10])n.box(i,15,11,i+2,19,13,E(ue.frame)),st(n,0,i,i+2,16,18,12,be("#ffd890")),n.box(i,19,11,i+2,20,13,t);for(let i of[4,10])n.box(i,15,3,i+2,19,5,E(ue.frame)),st(n,2,i,i+2,16,18,3,be("#ffc86a"));return n.box(3,20,7,5,24,9,We(ue.brick,{seed:83,cell:[1,1,1]})),n.box(11,20,7,13,24,9,We(ue.brick,{seed:84,cell:[1,1,1]})),Qf(n,"x",1,15,14,0,ue.darkMetal,[[6,10]]),Rt(n,2,12,0,3,2,2,85),Rt(n,11,12,0,3,2,2,86),{g:n}}function CT(){let n=Ci(76),e=We("#e8a27a",{seed:90,cell:[10,5,10],dark:.3,dk:.95,light:.2}),t=12,i=5;n.box(2,0,2,14,5,14,E("#d8cfc2")),st(n,0,4,12,1,4,13,be("#ffe2a8")),n.box(3,5,3,13,5+t*i,13,e);for(let o=1;o<=t;o++)n.box(3,5+o*i-1,3,13,5+o*i,13,E("#f6e6d6"));Ke(n,3,3,13,13,{y0:5,floors:t-2,floorH:i,sill:1,h:3,w:2,pitch:3,style:"tower",seed:91});let s=5+(t-2)*i;n.box(3,s,3,13,5+t*i,13,0),n.box(4,s,4,12,5+t*i,12,E("#f6e6d6")),Ke(n,4,4,12,12,{y0:s,floors:2,floorH:i,sill:1,h:3,w:2,pitch:2,margin:0,style:"tower",seed:92}),Sn(n,3,3,13,13,s,E("#f6e6d6"));let r=5+t*i;return gl(n,4,4,12,12,r,93),n.paintSolid(7,5,12,9,s,13,E("#c97f5a")),{g:n}}function PT(){let n=Ci(62),e=We("#e2e6ea",{seed:100,cell:[12,5,12],dark:.3,dk:.95}),t=10,i=5;n.box(2,0,4,14,t*i+1,12,e),n.box(2,0,4,14,1,12,E("#8f949a")),Ke(n,2,4,14,12,{y0:0,floors:t,floorH:i,sill:1,h:3,w:2,pitch:3,style:"tower",seed:101,skip:(l,c,u)=>l===0&&u===0&&c>=6&&c<=8}),oi(n,7,2,1,4,11,"#2f6f6a");let s=E("#7fd0c8"),r=E("#cfd5da");for(let l=1;l<t;l++){let c=l*i;n.box(3,c,12,13,c+1,14,r),n.box(3,c+1,13,13,c+2,14,s),n.box(3,c,2,13,c+1,4,r),n.box(3,c+1,2,13,c+2,3,s)}n.box(1,1,7,2,t*i,9,E("#2fb3a6")),n.box(14,1,7,15,t*i,9,E("#2fb3a6"));let o=t*i+1;gl(n,2,4,14,12,o,102);let a=E(ue.wood);for(let l of[8,12])for(let c of[5,10])n.box(l,o+1,c,l+1,o+4,c+1,a);return n.box(8,o+4,5,13,o+5,11,E(ue.wood,.9)),{g:n}}function IT(){let n=Ci(80),e=5,t=We("#f4f2ee",{seed:110,cell:[12,5,12],dark:.25,dk:.95}),i=E("#8fb8e0"),s=[[2,0,5],[3,5,9],[4,9,14]];for(let[r,o,a]of s){let l=o*e,c=a*e;n.box(r,l,r,16-r,c,16-r,t);for(let u=o;u<a;u++)n.box(r,u*e,r,16-r,u*e+1,16-r,i);if(Ke(n,r,r,16-r,16-r,{y0:l,floors:a-o,floorH:e,sill:1,h:3,w:2,pitch:3,style:"tower",seed:111+o,skip:(u,d,h)=>o===0&&h===0&&u===0&&d>=6&&d<=8}),o>0){let u=r-1;n.box(u,l,u,16-u,l+1,u+1,We(ue.hedge,{seed:o,cell:[1,1,1],dark:.3})),n.box(u,l,15-u,16-u,l+1,16-u,We(ue.hedge,{seed:o+1,cell:[1,1,1],dark:.3}))}}return oi(n,7,2,1,4,13,"#3a4a6a"),n.box(6,4,14,10,5,16,E("#3a4a6a")),gl(n,4,4,12,12,14*e,112),Ei(n,11,5,14*e+1,6),{g:n}}function LT(){let n=Ci(72),e=5,t=13,i=8,s=8;n.box(2,0,2,14,4,14,Ut(ue.brick,1,.94)),st(n,0,4,12,1,3,13,be("#ffd890")),oi(n,7,2,0,3,13,"#3d2f2a",!1),De(n,i,s,5.6,4,4+t*e,We("#f0d9b0",{seed:120,cell:[11,5,11],dark:.3,dk:.95})),Xr(n,i,s,5.6,4,t,e,1,3,"tower",121,14);for(let o=1;o<t;o++){let a=4+o*e;De(n,i,s,6.4,a,a+1,E("#f7efe2"))}let r=4+t*e;return De(n,i,s,5.6,r,r+1,E("#7fbf5a")),De(n,i,s,4.5,r,r+1,We(ue.grass,{seed:122,cell:[2,1,2]})),Wi(n,6,7,r+1,123,2,"#5db84a"),Rt(n,9,9,r+1,2,2,1,124),n.box(10,r+1,5,11,r+3,6,E(ue.metal)),{g:n}}function Dx(n,e){return n===1?[_T,MT,wT,ST][e]():n===2?[TT,ET,AT,RT][e]():[CT,PT,IT,LT][e]()}function kx(n,e,t){return n===2?Ix(e,t):n===3?Lx(e,t):Dx(e,t)}var Ko=4,rp=new Map,DT=new Map;function Nx(n,e){let t={body:e.body,glow:e.glow,height:e.height};return e.smoke&&(t.smoke=e.smoke),e.spinner&&(t.spinner=e.spinner),rp.set(n,t),DT.set(n,e.triangles),t}function op(n,e){let t=rp.get(n);return t||Nx(n,Rx(e()))}function gh(n,e,t){let i=Number.isFinite(n)?Math.floor(n):e;return i<e?e:i>t?t:i}function ap(n,e,t){let i=n===2||n===3?n:1,s=gh(e,1,3),r=(gh(t,0,1<<30)%Ko+Ko)%Ko;return op(`z${i}-${s}-${r}`,()=>kx(i,s,r))}function xh(n){return op(`b-${n}`,()=>Ax(n))}function lp(n){let e=gh(n,1,3);return op(`t${e}`,()=>({g:Cx(e)}))}var Ds=6;function cp(n){let e=(gh(n,0,1073741824)%Ds+Ds)%Ds,t=`car${e}`,i=rp.get(t);if(i)return i;let s=new ds;s.append(br(e%wx));let r=s.toGeometries();return Nx(t,{body:r.body,glow:r.glow,height:Sx(e),triangles:s.triangles})}function Ux(){for(let n of[1,2,3])for(let e=1;e<=3;e++)for(let t=0;t<Ko;t++)ap(n,e,t);for(let n of ju)xh(n);for(let n=1;n<=3;n++)lp(n);for(let n=0;n<Ds;n++)cp(n)}var Ox=.55,kT=160,Fx=new WeakMap;function _l(n){let e=Fx.get(n.body);if(e&&(e.userData.glowSrc??null)===n.glow)return e;let t=[[n.body,0]];n.glow&&t.push([n.glow,1]);let i=[],s=0;for(let[d,h]of t){let f=d.index?d.toNonIndexed():d,p=f!==d;f.getAttribute("normal")||(p||(f=f.clone(),p=!0),f.computeVertexNormals()),i.push([f,h,p]),s+=f.getAttribute("position").count}let r=new Float32Array(s*3),o=new Float32Array(s*3),a=new Float32Array(s*3),l=new Float32Array(s),c=0;for(let[d,h,f]of i){let p=d.getAttribute("position"),x=d.getAttribute("normal"),g=d.getAttribute("color");for(let m=0;m<p.count;m++,c++)r[c*3]=p.getX(m),r[c*3+1]=p.getY(m),r[c*3+2]=p.getZ(m),o[c*3]=x.getX(m),o[c*3+1]=x.getY(m),o[c*3+2]=x.getZ(m),g?(a[c*3]=g.getX(m),a[c*3+1]=g.getY(m),a[c*3+2]=g.getZ(m)):h?(a[c*3]=1,a[c*3+1]=.85,a[c*3+2]=.55):a[c*3]=a[c*3+1]=a[c*3+2]=.8,l[c]=h;f&&d.dispose()}let u=new zt;return u.setAttribute("position",new xn(r,3)),u.setAttribute("normal",new xn(o,3)),u.setAttribute("color",new xn(a,3)),u.setAttribute("aGlow",new xn(l,1)),u.computeBoundingSphere(),u.computeBoundingBox(),u.userData.glowSrc=n.glow,Fx.set(n.body,u),u}var Ml=class{constructor(e,t){this.material=e;this.dustSink=t;this.group=new un;this.groups=new Map;this.groupList=[];this.tileInst=[];this.bldInst=new Map;this.growing=[];this.spinGroups=[];this.state=null;this.shadows=!0;this.emitters=new Float32Array(0);this.emitterCount=0;this.emittersDirty=!0;this.mBase=new gt;this.mLocal=new gt;this.mOut=new gt;this.arr=new Float32Array(16);this.group.name="models"}setShadows(e){this.shadows=e;for(let t of this.groups.values())t.mesh&&(t.mesh.castShadow=e),t.spin?.mesh&&(t.spin.mesh.castShadow=e)}setState(e){this.state=e;for(let i of this.groups.values())i.mesh&&(this.group.remove(i.mesh),i.mesh.dispose()),i.spin?.mesh&&(this.group.remove(i.spin.mesh),i.spin.mesh.dispose());this.groups.clear(),this.groupList=[],this.spinGroups=[],this.growing=[],this.bldInst.clear();let t=e.size*e.size;this.tileInst=new Array(t).fill(null);for(let i=0;i<t;i++)this.updateTile(i,!1);this.syncBuildings(!1),this.flush()}static animateFor(e){return e<=kT}updateTile(e,t){let i=this.state;if(!i)return;let s=i.tiles,r=e%i.size,o=e/i.size|0,a=null,l="",c=0,u=s.kind[e];if(u===2&&s.level[e]>0&&s.zone[e]>=1&&s.zone[e]<=3){let h=Math.min(3,s.level[e]),f=s.variant[e]%Ko;l=`z${s.zone[e]}-${h}-${f}`,a=this.groups.get(l)?.parts??ap(s.zone[e],h,f),c=oh(i,r,o)}else if(u===0&&s.trees[e]>0&&s.terrain[e]!==1){let h=Math.min(3,s.trees[e]);l=`t${h}`,a=this.groups.get(l)?.parts??lp(h),c=ve(r,o,17)*4|0}let d=this.tileInst[e];if(d&&d.group.key===l){d.rot!==c&&(d.rot=c,d.group.dirty=!0);return}if(d&&(this.removeInst(d),this.tileInst[e]=null,t&&!a&&d.group.key[0]==="z"&&this.dustSink.dust(r,o,1,1)),a){let h=this.addInst(l,a,r+.5,o+.5,c,e,-1);this.tileInst[e]=h,t&&(this.startGrow(h),l[0]==="z"&&this.dustSink.dust(r,o,1,1))}}syncBuildings(e){let t=this.state;if(!t)return;let i=new Set,s=0;for(let r of t.buildings){if(!r||!nt[r.type])continue;let o=this.bldInst.get(r.id);(!o||o.group.key!==`b-${r.type}`||o.x!==r.x+r.w/2||o.z!==r.z+r.h/2)&&s++}s>12&&(e=!1);for(let r of t.buildings){if(!r||!nt[r.type])continue;i.add(r.id);let o=`b-${r.type}`,a=r.x+r.w/2,l=r.z+r.h/2,c=(r.rot%4+4)%4,u=this.bldInst.get(r.id);if(u&&u.group.key===o&&u.x===a&&u.z===l){u.rot!==c&&(u.rot=c,u.group.dirty=!0);continue}u&&this.removeInst(u);let d=this.groups.get(o)?.parts??xh(r.type),h=this.addInst(o,d,a,l,c,-1,r.id);h.active=r.active,this.bldInst.set(r.id,h),e&&(this.startGrow(h),this.dustSink.dust(r.x,r.z,r.w,r.h))}for(let[r,o]of this.bldInst){if(i.has(r))continue;let a=o.group;if(this.removeInst(o),this.bldInst.delete(r),e){let l=nt[a.key.slice(2)]?.size??1;this.dustSink.dust(o.x-l/2,o.z-l/2,l,l)}}this.emittersDirty=!0}refreshActivity(){let e=this.state;if(e){for(let t of this.groups.values())if(!(!t.parts.smoke||t.parts.smoke.length===0))for(let i of t.members)if(i.tile>=0)i.active=e.tiles.power[i.tile]===1;else{let s=e.buildings[i.bid];i.active=!!s&&s.active}this.emittersDirty=!0}}heightAt(e){let t=this.tileInst[e];if(t)return t.group.parts.height;let i=this.state;if(i&&i.tiles.kind[e]===3){let s=this.bldInst.get(i.tiles.bld[e]);if(s)return s.group.parts.height}return 0}flush(){for(let e=0;e<this.groupList.length;e++){let t=this.groupList[e];t.dirty&&(t.dirty=!1,this.writeGroup(t))}this.emittersDirty&&this.rebuildEmitters()}tick(e,t){if(this.growing.length)for(let i=this.growing.length-1;i>=0;i--){let s=this.growing[i];if(s.growT+=e,(s.growT>=Ox||s.index<0)&&(s.growT=-1,this.growing[i]=this.growing[this.growing.length-1],this.growing.pop()),s.index<0)continue;let r=s.group.mesh;r&&(this.writeInst(s,r.instanceMatrix.array),r.instanceMatrix.needsUpdate=!0)}for(let i=0;i<this.spinGroups.length;i++){let s=this.spinGroups[i],r=s.spin;if(!r||!r.mesh||s.members.length===0)continue;let o=r.mesh.instanceMatrix.array;for(let a=0;a<s.members.length;a++){let l=s.members[a],c=ve(l.x*7,l.z*3,5)*6.28,u=t*r.speed+c;this.writeInst(l,this.arr,0),this.mBase.fromArray(this.arr),r.axis==="x"?this.mLocal.makeRotationX(u):r.axis==="y"?this.mLocal.makeRotationY(u):this.mLocal.makeRotationZ(u),this.mLocal.setPosition(r.pivot),this.mOut.multiplyMatrices(this.mBase,this.mLocal),this.mOut.toArray(o,l.index*16)}r.mesh.instanceMatrix.needsUpdate=!0}}ghostGeometry(e){return _l(xh(e))}dispose(){for(let e of this.groups.values())e.mesh&&e.mesh.dispose(),e.spin?.mesh&&e.spin.mesh.dispose(),e.geom.dispose(),e.spin?.geom.dispose();this.groups.clear(),this.groupList=[]}getGroup(e,t){let i=this.groups.get(e);return i||(i={key:e,parts:t,geom:_l(t),mesh:null,members:[],dirty:!0,spin:t.spinner?{geom:_l({body:t.spinner.geometry,glow:null}),mesh:null,pivot:t.spinner.pivot.clone(),axis:t.spinner.axis,speed:t.spinner.speed}:null},this.groups.set(e,i),this.groupList.push(i),i.spin&&this.spinGroups.push(i)),i}addInst(e,t,i,s,r,o,a){let l=this.getGroup(e,t),c={group:l,index:l.members.length,x:i,z:s,rot:r,growT:-1,tile:o,bid:a,active:!0};return o>=0&&this.state&&(c.active=this.state.tiles.power[o]===1),l.members.push(c),l.dirty=!0,t.smoke&&t.smoke.length&&(this.emittersDirty=!0),c}removeInst(e){let t=e.group,i=t.members.pop();i!==e&&(t.members[e.index]=i,i.index=e.index),e.index=-1,t.dirty=!0,t.parts.smoke&&t.parts.smoke.length&&(this.emittersDirty=!0)}startGrow(e){e.growT=0,this.growing.push(e)}writeInst(e,t,i=e.index*16){let s=1,r=1;if(e.growT>=0){let o=Math.min(1,e.growT/Ox),a=1.9,l=o-1;s=Math.max(.02,1+(a+1)*l*l*l+a*l*l),r=.82+.18*(1-(1-o)*(1-o))}Cs(t,i,e.x,0,e.z,e.rot*(Math.PI/2),r,s)}writeGroup(e){let t=e.members.length;if(t===0){e.mesh&&(e.mesh.visible=!1),e.spin?.mesh&&(e.spin.mesh.visible=!1);return}if(!e.mesh||e.mesh.instanceMatrix.count<t){let s=Math.max(8,Math.ceil(t*1.5));e.mesh&&(this.group.remove(e.mesh),e.mesh.dispose()),e.mesh=this.makeMesh(e.geom,s,`m-${e.key}`),e.spin&&(e.spin.mesh&&(this.group.remove(e.spin.mesh),e.spin.mesh.dispose()),e.spin.mesh=this.makeMesh(e.spin.geom,s,`s-${e.key}`))}let i=e.mesh.instanceMatrix.array;for(let s of e.members)this.writeInst(s,i);if(e.mesh.count=t,e.mesh.visible=!0,e.mesh.instanceMatrix.needsUpdate=!0,e.mesh.computeBoundingSphere(),e.spin?.mesh){e.spin.mesh.count=t,e.spin.mesh.visible=!0;let s=e.spin.mesh.instanceMatrix.array;for(let r of e.members)this.writeInst(r,s);e.spin.mesh.computeBoundingSphere(),e.spin.mesh.boundingSphere&&(e.spin.mesh.boundingSphere.radius+=2)}}makeMesh(e,t,i){let s=new jn(e,this.material,t);return s.instanceMatrix.setUsage(Si),s.castShadow=this.shadows,s.receiveShadow=!0,s.count=0,s.name=i,s.matrixAutoUpdate=!1,this.group.add(s),s}rebuildEmitters(){this.emittersDirty=!1;let e=0;for(let i of this.groups.values())i.parts.smoke&&(e+=i.parts.smoke.length*i.members.length);this.emitters.length<e*3&&(this.emitters=new Float32Array(Math.max(48,e*3)));let t=0;for(let i of this.groups.values()){let s=i.parts.smoke;if(!(!s||!s.length))for(let r of i.members){if(!r.active)continue;let o=r.rot*(Math.PI/2),a=Math.cos(o),l=Math.sin(o);for(let c of s)this.emitters[t*3]=r.x+c.x*a+c.z*l,this.emitters[t*3+1]=c.y,this.emitters[t*3+2]=r.z-c.x*l+c.z*a,t++}}this.emitterCount=t}};var wl=.17;function NT(){let n=new Rs,e=sn("#5a6170"),t=sn("#3f4450"),i=sn("#ffd68a"),s=.022;return n.box(-.04,0,-.04,.04,.05,.04,t[0],t[1],t[2]),n.box(-s,.05,-s,s,.6,s,e[0],e[1],e[2]),n.box(-s*.8,.58,-s,s*.8,.615,wl+.03,e[0],e[1],e[2]),n.box(-.035,.555,wl-.045,.035,.585,wl+.04,i[0],i[1],i[2],1,!0),n.build(!1,!0)}function UT(){let n=document.createElement("canvas");n.width=n.height=64;let e=n.getContext("2d"),t=e.createRadialGradient(32,32,0,32,32,32);t.addColorStop(0,"rgba(255,255,255,0.95)"),t.addColorStop(.35,"rgba(255,255,255,0.55)"),t.addColorStop(.7,"rgba(255,255,255,0.15)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.fillRect(0,0,64,64);let i=new Ui(n);return i.colorSpace=Wt,i}var OT=new Re("#ffc86e"),up=new Re("#fff2cf"),bh=class{constructor(e){this.staticCount=0;let t=new di(1,1);t.rotateX(-Math.PI/2),this.mat=new Hn({map:UT(),transparent:!0,depthWrite:!1,blending:ka,fog:!1,opacity:0}),this.cap=e,this.mesh=this.make(t,e)}make(e,t){let i=new jn(e,this.mat,t);return i.instanceMatrix.setUsage(Si),i.instanceColor=new cn(new Float32Array(t*3),3),i.count=0,i.frustumCulled=!1,i.renderOrder=3,i.name="light-pools",i.visible=!1,i}reserve(e){let t=e+nn;if(t<=this.cap)return null;this.cap=Math.ceil(t*1.3);let i=this.mesh,s=this.make(i.geometry,this.cap);return i.dispose(),this.mesh=s,s}setStatic(e,t,i,s){Cs(this.mesh.instanceMatrix.array,e*16,t,.012,i,0,s,1),this.mesh.setColorAt(e,OT)}setHeadlight(e,t,i,s,r){let o=this.staticCount+e;Jg(this.mesh.instanceMatrix.array,o*16,t,.014,i,s,.32*r,1,.62*r);let a=this.mesh.instanceColor.array;a[o*3]=up.r,a[o*3+1]=up.g,a[o*3+2]=up.b}commit(e,t){this.mat.opacity=Math.min(1,e*1.1)*.8;let i=e>.03;this.mesh.visible=i&&this.staticCount+t>0,i&&(this.mesh.count=this.staticCount+t,this.mesh.instanceMatrix.needsUpdate=!0,this.mesh.instanceColor&&(this.mesh.instanceColor.needsUpdate=!0))}dispose(){this.mesh.geometry.dispose(),this.mat.map?.dispose(),this.mat.dispose(),this.mesh.dispose()}},yh=class{constructor(e,t,i){this.material=e;this.pools=t;this.onPoolsMeshChanged=i;this.group=new un;this.mesh=null;this.geom=NT();this.cap=0;this.group.name="lamps"}rebuild(e){let t=e.size,i=e.tiles.kind,s=[];for(let c=0;c<t;c++)for(let u=0;u<t;u++){if(i[c*t+u]!==1||(u+c)%2!==0)continue;let d=gr(e,u,c),h=0,f=0;if(d===15){let x=ve(u,c,31)*4|0;h=x&1?Vi:-Vi,f=x&2?Vi:-Vi}else{let x=[];for(let g=0;g<4;g++)d&1<<g||x.push(g);if(d===5||d===10){let g=(u+c>>1)%2,m=x[g%x.length];h=ni[m]*Vi,f=ii[m]*Vi}else if(x.length===2&&((x[0]+1)%4===x[1]||(x[1]+1)%4===x[0]))h=(ni[x[0]]+ni[x[1]])*Vi,f=(ii[x[0]]+ii[x[1]])*Vi;else{let g=x[ve(u,c,32)*x.length|0];h=ni[g]*Vi,f=ii[g]*Vi}}let p=Math.atan2(-h,-f);s.push(u+.5+h,c+.5+f,p)}let r=s.length/3;(!this.mesh||this.cap<r)&&(this.mesh&&(this.group.remove(this.mesh),this.mesh.dispose()),this.cap=Math.max(32,Math.ceil(r*1.4)),this.mesh=new jn(this.geom,this.material,this.cap),this.mesh.castShadow=!1,this.mesh.receiveShadow=!0,this.mesh.name="lamps",this.mesh.matrixAutoUpdate=!1,this.group.add(this.mesh));let o=this.pools.mesh,a=this.pools.reserve(r);a&&this.onPoolsMeshChanged(o,a);let l=this.mesh.instanceMatrix.array;for(let c=0;c<r;c++){let u=s[c*3],d=s[c*3+1],h=s[c*3+2];Cs(l,c*16,u,0,d,h,1,1),this.pools.setStatic(c,u+Math.sin(h)*wl,d+Math.cos(h)*wl,.95)}this.pools.staticCount=r,this.mesh.count=r,this.mesh.visible=r>0,this.mesh.instanceMatrix.needsUpdate=!0,this.mesh.computeBoundingSphere()}dispose(){this.mesh&&this.mesh.dispose(),this.geom.dispose()}};function ks(n){let e=parseInt(n.slice(1),16);return[e>>16&255,e>>8&255,e&255]}function Bx(n,e){let t=Math.max(0,Math.min(1,e))*(n.length-1),i=Math.min(n.length-2,Math.floor(t)),s=t-i,r=n[i],o=n[i+1];return[r[0]+(o[0]-r[0])*s,r[1]+(o[1]-r[1])*s,r[2]+(o[2]-r[2])*s]}var Yr={power:"#ffcc2e",water:"#36a3ff",missing:"#ff4040",pollutionLow:"#d8b04a",pollutionHigh:"#5e2a6e",valueLow:"#e5483b",valueMid:"#ffd23f",valueHigh:"#33cf6a",police:"#3d7bff",fire:"#ff5a36",health:"#ff5fa2",education:"#9b6bff"},vh=class{constructor(){this.group=new un;this.tex=null;this.sheet=null;this.rings=null;this.kind="none";this.size=0;this.dirty=!0;this.group.name="overlay",this.sheetMat=new Hn({transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),this.ringMat=new Hn({vertexColors:!0,transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1,side:Vn}),this.group.visible=!1}get current(){return this.kind}setKind(e){e!==this.kind&&(this.kind=e,this.dirty=!0,this.group.visible=e!=="none")}setState(e){if(e.size!==this.size){this.size=e.size,this.tex?.dispose();let t=new Uint8Array(e.size*e.size*4);this.tex=new ws(t,e.size,e.size,Ln),this.tex.colorSpace=Wt,this.tex.flipY=!1,this.tex.generateMipmaps=!1,this.sheetMat.map=this.tex,this.sheetMat.needsUpdate=!0,this.sheet&&(this.group.remove(this.sheet),this.sheet.geometry.dispose());let i=e.size,s=new zt;s.setAttribute("position",new kt([0,.025,0,i,.025,0,i,.025,i,0,.025,i],3)),s.setAttribute("uv",new kt([0,0,1,0,1,1,0,1],2)),s.setIndex([0,2,1,0,3,2]),s.computeBoundingSphere(),this.sheet=new St(s,this.sheetMat),this.sheet.renderOrder=2,this.sheet.name="overlay-sheet",this.group.add(this.sheet)}this.dirty=!0}rebuild(e){if(this.dirty=!1,this.kind==="none"||!this.tex)return;let t=this.kind,i=e.tiles,s=e.size*e.size,r=this.tex.image.data,o=t==="power"||t==="water",a=o?Kt:qt;this.tex.magFilter!==a&&(this.tex.magFilter=a,this.tex.minFilter=a);let l=Yr,c=ks(t==="water"?l.water:l.power),u=ks(l.missing),d=[ks(l.pollutionLow),ks("#b06a3a"),ks(l.pollutionHigh)],h=[ks(l.valueLow),ks(l.valueMid),ks(l.valueHigh)],f=t==="police"||t==="fire"||t==="health"||t==="education"?ks(l[t]):null;for(let p=0;p<s;p++){let x=[0,0,0],g=0,m=i.kind[p];if(!Xo(e,p)){if(o){let w=t==="power"?i.power:i.water,y=m===2;if(m===3){let _=e.buildings[i.bld[p]],M=_?nt[_.type]:null;if(y=!!M&&(t==="power"?M.needsPower||!!M.power:!!M.water||M.needsPower),M&&(t==="power"&&M.power||t==="water"&&M.water)){x=c,g=215,zx(r,p,x,g);continue}}w[p]?(x=c,g=y?150:m===1?0:42):y&&(x=u,g=170)}else if(t==="pollution"){let w=i.pollution[p];x=Bx(d,w/255),w>4&&(g=Math.min(210,40+w*1.2))}else if(t==="landValue")x=Bx(h,i.landValue[p]/255),g=m===1?60:150;else if(f){let w=i[t][p];x=f,w>0?g=Math.min(190,50+w*.6):m===2&&i.level[p]>0&&(x=u,g=80)}}zx(r,p,x,g)}this.tex.needsUpdate=!0,this.buildRings(e)}buildRings(e){this.rings&&(this.group.remove(this.rings),this.rings.geometry.dispose(),this.rings=null);let t=this.kind,i=Yr,s={pos:[],col:[],idx:[]};for(let r of e.buildings){if(!r)continue;let o=nt[r.type];if(!o)continue;let a=0,l=i.power;if(t==="power"&&o.power?(a=o.power.radius,l=i.power):t==="water"&&o.water?(a=o.water.radius,l=i.water):o.service&&o.service.kind===t&&(a=o.service.radius,l=i[t]),a<=0)continue;let c=sn(l);hl(r.x,r.z,r.x+r.w,r.z+r.h,a,.12,.03,s,[c[0],c[1],c[2],.9])}s.pos.length!==0&&(this.rings=new St(dl(s),this.ringMat),this.rings.renderOrder=3,this.rings.name="overlay-rings",this.group.add(this.rings))}dispose(){this.tex?.dispose(),this.sheet?.geometry.dispose(),this.rings?.geometry.dispose(),this.sheetMat.dispose(),this.ringMat.dispose()}};function zx(n,e,t,i){n[e*4]=t[0],n[e*4+1]=t[1],n[e*4+2]=t[2],n[e*4+3]=i}var FT=new Re("#ff3b30");function Hx(n){switch(n){case"road":return"#f4f1e8";case"zone_res":return Tt.res;case"zone_com":return Tt.com;case"zone_ind":return Tt.ind;case"bulldoze":return"#ff8a3d";case"inspect":return"#ffffff";default:return"#5fd4ff"}}function BT(n){let e=nt[n];if(e.power)return{radius:e.power.radius,color:Yr.power};if(e.water)return{radius:e.water.radius,color:Yr.water};if(e.service){let t=e.service.kind,i=t==="parks"?"#3ccf6a":Yr[t];return{radius:e.service.radius,color:i}}return e.landValue?{radius:e.landValue.radius,color:"#3ccf6a"}:null}function zT(){let n=document.createElement("canvas");n.width=n.height=64;let e=n.getContext("2d"),t=12;((r,o,a,l)=>{e.beginPath(),e.moveTo(r+t,o),e.arcTo(r+a,o,r+a,o+l,t),e.arcTo(r+a,o+l,r,o+l,t),e.arcTo(r,o+l,r,o,t),e.arcTo(r,o,r+a,o,t),e.closePath()})(4,4,56,56),e.fillStyle="rgba(255,255,255,0.42)",e.fill(),e.lineWidth=5,e.strokeStyle="rgba(255,255,255,0.95)",e.stroke();let s=new Ui(n);return s.colorSpace=Wt,s}var _h=class{constructor(e,t){this.ghostGeometry=e;this.group=new un;this.tileCap=64;this.ghostKey="";this.reach=null;this.reachKey="";this.selection=null;this.selKey="";this.selTile=null;this.tmpColor=new Re;this.tmpMat=new gt;this.group.name="preview",this.tileGeo=new di(1,1),this.tileGeo.rotateX(-Math.PI/2),this.tileMat=new Hn({map:zT(),transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1}),this.tiles=this.makeTiles(this.tileCap),this.ghostMat=new Qn({vertexColors:!0,transparent:!0,opacity:.62,emissive:new Re("#1d4a66")}),Yf(this.ghostMat,t);let i=new zt;this.ghostDepth=new St(i,new Hn({colorWrite:!1,transparent:!0,depthWrite:!0})),this.ghostDepth.renderOrder=8,this.ghost=new St(i,this.ghostMat),this.ghost.renderOrder=9,this.ghost.visible=this.ghostDepth.visible=!1,this.group.add(this.ghostDepth,this.ghost),this.ringMat=new Hn({vertexColors:!0,transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1,side:Vn}),this.selMat=new Hn({vertexColors:!0,transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1,side:Vn})}makeTiles(e){let t=new jn(this.tileGeo,this.tileMat,e);return t.instanceMatrix.setUsage(Si),t.instanceColor=new cn(new Float32Array(e*3),3),t.count=0,t.frustumCulled=!1,t.renderOrder=6,t.name="preview-tiles",t.visible=!1,this.group.add(t),t}setPreview(e,t){if(!e||!t||e.tiles.length===0){this.tiles.visible=!1,this.hideGhost();return}let i=e.tiles.length;i>this.tileCap&&(this.group.remove(this.tiles),this.tiles.dispose(),this.tileCap=Math.ceil(i*1.5),this.tiles=this.makeTiles(this.tileCap));let s=new Re(Hx(e.tool)),r=t.size;for(let a=0;a<i;a++){let l=e.tiles[a],c=l%r,u=l/r|0;this.tmpMat.makeTranslation(c+.5,.035,u+.5),this.tiles.setMatrixAt(a,this.tmpMat);let d=e.ok[a]!==!1;this.tmpColor.copy(d?s:FT),this.tiles.setColorAt(a,this.tmpColor)}this.tiles.count=i,this.tiles.visible=!0,this.tiles.instanceMatrix.needsUpdate=!0,this.tiles.instanceColor&&(this.tiles.instanceColor.needsUpdate=!0);let o=e.building?.type??pr(e.tool);e.building&&o&&nt[o]?this.showGhost(e.building,e.valid):this.hideGhost()}showGhost(e,t){if(this.ghostKey!==e.type){this.ghostKey=e.type;let a=this.ghostGeometry(e.type);this.ghost.geometry=a,this.ghostDepth.geometry=a}let i=e.x+e.w/2,s=e.z+e.h/2;for(let a of[this.ghost,this.ghostDepth])a.position.set(i,.02,s),a.rotation.set(0,(e.rot%4+4)%4*(Math.PI/2),0),a.visible=!0;this.ghostMat.color.set(t?"#ffffff":"#ff9a90"),this.ghostMat.emissive.set(t?"#1d4a66":"#6a1010");let r=BT(e.type),o=r?`${e.x},${e.z},${e.w},${e.h},${r.radius},${t}`:"";if(o!==this.reachKey&&(this.reachKey=o,this.reach&&(this.group.remove(this.reach),this.reach.geometry.dispose(),this.reach=null),r)){let a={pos:[],col:[],idx:[]},l=sn(t?r.color:"#ff3b30");hl(e.x,e.z,e.x+e.w,e.z+e.h,r.radius,.12,.04,a,[l[0],l[1],l[2],.9],.1),this.reach=new St(dl(a),this.ringMat),this.reach.renderOrder=5,this.reach.name="preview-reach",this.group.add(this.reach)}this.reach&&(this.reach.visible=!0)}hideGhost(){this.ghost.visible=!1,this.ghostDepth.visible=!1,this.reach&&(this.reach.visible=!1)}setSelection(e,t){this.selTile=e?{x:e.x,z:e.z}:null,this.refreshSelection(t)}refreshSelection(e){let t=this.selTile;if(!t||!e||t.x<0||t.z<0||t.x>=e.size||t.z>=e.size){this.selection&&(this.selection.visible=!1);return}let i=t.x,s=t.z,r=1,o=1,a=t.z*e.size+t.x;if(e.tiles.kind[a]===3){let c=e.buildings[e.tiles.bld[a]];c&&(i=c.x,s=c.z,r=c.w,o=c.h)}let l=`${i},${s},${r},${o}`;if(l!==this.selKey||!this.selection){this.selKey=l,this.selection&&(this.group.remove(this.selection),this.selection.geometry.dispose());let c={pos:[],col:[],idx:[]};hl(i,s,i+r,s+o,.06,.09,.05,c,[1,1,1,1],.12),this.selection=new St(dl(c),this.selMat),this.selection.renderOrder=10,this.selection.name="selection",this.group.add(this.selection)}this.selection.visible=!0}update(e){this.selMat.opacity=.75+.25*Math.sin(e*4),this.ghostMat.opacity=.55+.1*Math.sin(e*3)}dispose(){this.tiles.dispose(),this.tileGeo.dispose(),this.tileMat.map?.dispose(),this.tileMat.dispose(),this.ghostMat.dispose(),this.ghostDepth.material.dispose(),this.reach?.geometry.dispose(),this.selection?.geometry.dispose(),this.ringMat.dispose(),this.selMat.dispose()}};var HT=[{t:0,zenith:"#0b1433",horizon:"#1f2d58",below:"#0e1733",sun:"#a8b8e8",sunI:.6,hemiSky:"#3a4a7c",hemiGround:"#151a2e",hemiI:.75,glass:"#161c30"},{t:.19,zenith:"#111d44",horizon:"#2b3a6a",below:"#141e42",sun:"#acbbe8",sunI:.55,hemiSky:"#3e4e80",hemiGround:"#161b32",hemiI:.75,glass:"#181e36"},{t:.24,zenith:"#3a5a9a",horizon:"#f2a98c",below:"#8f7fa6",sun:"#ffb27a",sunI:.9,hemiSky:"#a2a8d4",hemiGround:"#5e505e",hemiI:.9,glass:"#3a4a6e"},{t:.3,zenith:"#5ea8ea",horizon:"#ffd9b0",below:"#a9c9e9",sun:"#ffdcb0",sunI:2.1,hemiSky:"#bcd6f2",hemiGround:"#7e7660",hemiI:.9,glass:"#4a6a90"},{t:.4,zenith:"#4aa6f2",horizon:"#d8f0ff",below:"#a6d4f5",sun:"#fff3df",sunI:2.35,hemiSky:"#c4e0ff",hemiGround:"#7c7a5c",hemiI:.82,glass:"#4f7398"},{t:.6,zenith:"#4aa6f2",horizon:"#dcf1ff",below:"#a8d5f5",sun:"#fff0da",sunI:2.35,hemiSky:"#c4e0ff",hemiGround:"#7c7a5c",hemiI:.82,glass:"#4f7398"},{t:.68,zenith:"#5a96e0",horizon:"#ffe0b0",below:"#b8c4e0",sun:"#ffd8a0",sunI:2.25,hemiSky:"#c4d2ec",hemiGround:"#7c6c50",hemiI:.85,glass:"#566a8c"},{t:.735,zenith:"#6272bc",horizon:"#ffbb70",below:"#e0a596",sun:"#ffbf72",sunI:2,hemiSky:"#eac6cc",hemiGround:"#8c6c58",hemiI:1.15,glass:"#5a5878"},{t:.775,zenith:"#2c3778",horizon:"#d8747c",below:"#5c4a7a",sun:"#ff9a66",sunI:.75,hemiSky:"#7a6aa4",hemiGround:"#352840",hemiI:.85,glass:"#2a2c50"},{t:.83,zenith:"#0f1a40",horizon:"#263464",below:"#121b3c",sun:"#a8b8e8",sunI:.55,hemiSky:"#3a4a7c",hemiGround:"#151a2e",hemiI:.75,glass:"#161c30"},{t:1,zenith:"#0b1433",horizon:"#1f2d58",below:"#0e1733",sun:"#a8b8e8",sunI:.6,hemiSky:"#3a4a7c",hemiGround:"#151a2e",hemiI:.75,glass:"#161c30"}],Mh=HT.map(n=>({t:n.t,zenith:new Re(n.zenith),horizon:new Re(n.horizon),below:new Re(n.below),sun:new Re(n.sun),sunI:n.sunI,hemiSky:new Re(n.hemiSky),hemiGround:new Re(n.hemiGround),hemiI:n.hemiI,glass:new Re(n.glass)})),GT=`
uniform mat4 uProjInv;
uniform mat4 uCamWorld;
varying vec3 vDir;
void main() {
  vec4 v = uProjInv * vec4(position.xy, 1.0, 1.0);
  v.xyz /= v.w;
  vDir = (uCamWorld * vec4(v.xyz, 0.0)).xyz;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}`,VT=`
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uBelow;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uSunVis;
uniform float uNight;
varying vec3 vDir;
float sHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  vec3 col;
  if (d.y >= 0.0) {
    col = mix(uHorizon, uZenith, pow(min(1.0, d.y * 1.6), 0.55));
    // a few stars high up at night
    vec3 cell = floor(d * 140.0);
    float st = step(0.997, sHash(cell)) * smoothstep(0.05, 0.3, d.y) * uNight;
    col += vec3(st * 0.9);
  } else {
    col = mix(uHorizon, uBelow, smoothstep(0.0, 0.55, -d.y));
  }
  // warm halo around the sun (or a cool one round the moon), strongest near the horizon
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunCol * (pow(sd, 10.0) * 0.32 + pow(sd, 220.0) * 0.9) * uSunVis;
  // no tone mapping here: fog colours are not tone mapped either, and they must match exactly
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`,wh=class{constructor(){this.sun=new Ia(16777215,2.5);this.hemi=new Ca(13625599,9210470,1.1);this.fog=new _a(13625599,60,200);this.glass=new Re;this.horizon=new Re;this.night=0;this.viewDistance=40;this.uniforms={uProjInv:{value:new gt},uCamWorld:{value:new gt},uZenith:{value:new Re},uHorizon:{value:new Re},uBelow:{value:new Re},uSunDir:{value:new Z(0,1,0)},uSunCol:{value:new Re},uSunVis:{value:1},uNight:{value:0}};this.lightDir=new Z(.3,1,.5).normalize();this.mapSize=64;this.lastTime=-1;this.corners=Array.from({length:8},()=>new Z);this.ray=new Z;this.tmp=new Z;this.lightView=new gt;let e=new zt;e.setAttribute("position",new kt([-1,-1,0,3,-1,0,-1,3,0],3));let t=new vn({uniforms:this.uniforms,vertexShader:GT,fragmentShader:VT,depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1});this.backdrop=new St(e,t),this.backdrop.frustumCulled=!1,this.backdrop.renderOrder=-1e3,this.backdrop.name="sky",this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.bias=-4e-4,this.sun.shadow.normalBias=.02,this.sun.shadow.radius=2,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=200,this.sun.shadow.autoUpdate=!0}setMapSize(e){this.mapSize=e,this.lastTime=-1}setTime(e){let t=(e%1+1)%1;if(Math.abs(t-this.lastTime)<1e-5)return;this.lastTime=t;let i=0;for(;i<Mh.length-2&&Mh[i+1].t<=t;)i++;let s=Mh[i],r=Mh[i+1],o=ih(0,1,(t-s.t)/Math.max(1e-6,r.t-s.t)),a=this.uniforms;a.uZenith.value.copy(s.zenith).lerp(r.zenith,o),a.uHorizon.value.copy(s.horizon).lerp(r.horizon,o),a.uBelow.value.copy(s.below).lerp(r.below,o),this.horizon.copy(a.uHorizon.value),this.sun.color.copy(s.sun).lerp(r.sun,o),this.hemi.color.copy(s.hemiSky).lerp(r.hemiSky,o),this.hemi.groundColor.copy(s.hemiGround).lerp(r.hemiGround,o),this.hemi.intensity=s.hemiI+(r.hemiI-s.hemiI)*o,this.glass.copy(s.glass).lerp(r.glass,o),this.night=Vu(t),a.uNight.value=this.night;let l=(t-.25)*Math.PI*2,c=Math.sin(l),u;if(c>-.05){let d=zr((t-.25)/.5,0,1),h=wu.degToRad(15-115*d),f=Math.max(wu.degToRad(22),Math.asin(Math.min(1,Math.max(0,c)))*.68);this.lightDir.set(Math.sin(h)*Math.cos(f),Math.sin(f),Math.cos(h)*Math.cos(f)),u=s.sunI+(r.sunI-s.sunI)*o,u*=ih(-.05,.08,c)}else this.lightDir.set(-.42,.82,.38).normalize(),u=(s.sunI+(r.sunI-s.sunI)*o)*ih(-.05,-.18,c);this.sun.intensity=u,a.uSunDir.value.copy(this.lightDir),a.uSunCol.value.copy(this.sun.color),a.uSunVis.value=c>-.05?zr(1-c*.8,.25,1):.35,this.fog.color.copy(a.uHorizon.value).lerp(a.uBelow.value,.4)}prepare(e,t,i){let s=this.uniforms;s.uProjInv.value.copy(e.projectionMatrixInverse),s.uCamWorld.value.copy(e.matrixWorld);let r=e.position;e.getWorldDirection(this.ray);let o=this.ray.y<-.05?r.y/-this.ray.y:r.y*3;this.viewDistance=o,this.fog.near=o*1.35,this.fog.far=o*3.6+40,t&&this.fitShadow(e,i)}fitShadow(e,t){let i=this.mapSize,s=this.sun;s.target.position.set(i/2,0,i/2),s.position.copy(s.target.position).addScaledVector(this.lightDir,i),s.updateMatrixWorld(),s.target.updateMatrixWorld();let r=s.shadow.camera;r.position.copy(s.position),r.lookAt(s.target.position),r.updateMatrixWorld(),this.lightView.copy(r.matrixWorldInverse);let o=e.position,a=Math.max(30,o.y*4),l=1.5,c=0;for(let A=-1;A<=1;A+=2)for(let v=-1;v<=1;v+=2){this.ray.set(v,A,.5).unproject(e).sub(o).normalize();let S=a;this.ray.y<-.001&&(S=Math.min(a,o.y/-this.ray.y));let C=this.tmp.copy(o).addScaledVector(this.ray,S);C.x=zr(C.x,-l,i+l),C.z=zr(C.z,-l,i+l),C.y=0,this.corners[c++].copy(C),this.corners[c++].set(C.x,6,C.z)}let u=1/0,d=-1/0,h=1/0,f=-1/0,p=1/0,x=-1/0;for(let A=0;A<this.corners.length;A++){let v=this.corners[A].applyMatrix4(this.lightView);v.x<u&&(u=v.x),v.x>d&&(d=v.x),v.y<h&&(h=v.y),v.y>f&&(f=v.y),v.z<p&&(p=v.z),v.z>x&&(x=v.z)}let m=Math.ceil((Math.max(d-u,f-h)+1*2)/4)*4,b=m/t,w=(u+d)/2,y=(h+f)/2,_=Math.floor((w-m/2)/b)*b,M=Math.floor((y-m/2)/b)*b;r.left=_,r.right=_+m,r.bottom=M,r.top=M+m,r.near=Math.max(.1,-x-30),r.far=-p+10,r.updateProjectionMatrix(),s.shadow.normalBias=zr(b*.6,.01,.06)}dispose(){this.backdrop.geometry.dispose(),this.backdrop.material.dispose(),this.sun.shadow.map?.dispose()}};var WT=1.05,XT=.7,Gx=.42,YT=6,Vx=.35,qT=2.5,$T=0,ZT=2,KT=[1,.56,2.1,1.12];function Wx(n,e,t,i){let s=ni[n],r=ii[n],o=ni[e],a=ii[e],l=-.5*s-cl*r,c=-.5*r+cl*s,u=.5*o-cl*a,d=.5*a+cl*o,h=KT[(e-n+4)%4],f=s*h,p=r*h,x=o*h,g=a*h,m=t*t,b=m*t,w=2*b-3*m+1,y=b-2*m+t,_=-2*b+3*m,M=b-m;i[0]=w*l+y*f+_*u+M*x,i[1]=w*c+y*p+_*d+M*g;let A=6*m-6*t,v=3*m-4*t+1,S=-6*m+6*t,C=3*m-2*t;i[2]=A*l+v*f+S*u+C*x,i[3]=A*c+v*p+S*d+C*g}var Sh=(()=>{let n=new Float32Array(4),e=new Float32Array(4);for(let t=0;t<4;t++){let i=0,s=0,r=0;for(let o=0;o<=32;o++)Wx(1,(1+t)%4,o/32,e),o>0&&(i+=Math.hypot(e[0]-s,e[1]-r)),s=e[0],r=e[1];n[t]=i}return n})(),Th=class{constructor(e){this.group=new un;this.meshes=[];this.tile=new Int32Array(nn);this.din=new Int8Array(nn);this.dout=new Int8Array(nn);this.s=new Float32Array(nn);this.variant=new Uint8Array(nn);this.scale=new Float32Array(nn);this.mode=new Uint8Array(nn);this.wait=new Float32Array(nn);this.ahead=new Int16Array(nn);this.slots=new Int16Array(0);this.roadTiles=new Int32Array(0);this.roadCount=0;this.state=null;this.live=new Int16Array(nn);this.livePos=new Int16Array(nn);this.alive=0;this.free=new Int16Array(nn);this.freeCount=0;this.driving=0;this.spawnClock=0;this.seed=7;this.tmp=new Float32Array(4);this.counts=new Int32Array(Ds);this.target=0;this.prefill=!0;this.lastSpawned=0;this.group.name="traffic";for(let t=0;t<Ds;t++){let i=new jn(_l(cp(t)),e,nn);i.instanceMatrix.setUsage(Si),i.count=0,i.frustumCulled=!1,i.castShadow=!1,i.receiveShadow=!0,i.name=`cars-${t}`,i.matrixAutoUpdate=!1,this.meshes.push(i),this.group.add(i)}this.resetCars()}resetCars(){this.mode.fill(0),this.alive=0,this.driving=0,this.freeCount=nn;for(let e=0;e<nn;e++)this.free[e]=nn-1-e}setShadows(e){for(let t of this.meshes)t.castShadow=e}rand(){return this.seed=this.seed*1664525+1013904223>>>0,this.seed/4294967296}setState(e){this.state=e,this.resetCars(),this.slots=new Int16Array(e.size*e.size*4).fill(-1),this.prefill=!0,this.rebuildRoads();for(let t of this.meshes)t.count=0}rebuildRoads(){let e=this.state;if(!e)return;let t=e.size*e.size;this.roadTiles.length<t&&(this.roadTiles=new Int32Array(t));let i=0;for(let s=0;s<t;s++)e.tiles.kind[s]===1&&gr(e,s%e.size,s/e.size|0)!==0&&(this.roadTiles[i++]=s);this.roadCount=i}isRoadIdx(e){return this.state.tiles.kind[e]===1}chooseExit(e,t){let i=this.state,s=e%i.size,r=e/i.size|0,o=gr(i,s,r),a=Xf[t],l=0;for(let u=0;u<4;u++)u===a||!(o&1<<u)||(l+=u===t?2.2:1);if(l===0)return a;let c=this.rand()*l;for(let u=0;u<4;u++)if(!(u===a||!(o&1<<u))&&(c-=u===t?2.2:1,c<=0))return u;return t}spawnOne(){let e=this.state;if(this.roadCount===0||this.freeCount===0)return!1;let t=this.free[this.freeCount-1];for(let i=0;i<6;i++){let s=this.roadTiles[this.rand()*this.roadCount|0],r=s%e.size,o=s/e.size|0,a=gr(e,r,o);if(a===0)continue;let l=this.rand()*4|0,c=-1;for(let h=0;h<4;h++){let f=(l+h)%4;if(a&1<<Xf[f]){c=f;break}}if(c<0)continue;let u=s*4+c,d=this.slots[u];if(!(d>=0&&this.mode[d]!==0&&this.tile[d]===s&&this.din[d]===c))return this.tile[t]=s,this.din[t]=c,this.dout[t]=this.chooseExit(s,c),this.s[t]=this.rand()*.6,this.variant[t]=this.rand()*Ds|0,this.scale[t]=.01,this.mode[t]=1,this.wait[t]=0,this.ahead[t]=-1,this.slots[u]=t,this.freeCount--,this.live[this.alive]=t,this.livePos[t]=this.alive,this.alive++,this.driving++,this.lastSpawned=t,!0}return!1}release(e){let t=this.tile[e]*4+this.din[e];this.slots[t]===e&&(this.slots[t]=-1)}leave(e){this.mode[e]===1&&(this.mode[e]=2,this.driving--)}retire(e){this.release(e),this.mode[e]=0;let t=this.livePos[e],i=this.live[--this.alive];this.live[t]=i,this.livePos[i]=t,this.free[this.freeCount++]=e}update(e,t,i){let s=this.state;if(!s)return 0;let r=Math.min(e,.1),o=Math.min(this.target,nn,Math.floor(this.roadCount*.45));if(this.prefill){this.prefill=!1;let d=o*2;for(;this.alive<o&&d-- >0;){let h=this.alive;this.spawnOne()&&this.alive>h&&(this.scale[this.lastSpawned]=1)}}if(this.alive<o){for(this.spawnClock+=r*Math.max(YT,(o-this.alive)*.4);this.spawnClock>=1&&this.alive<o&&(this.spawnClock-=1,!!this.spawnOne()););this.spawnClock>2&&(this.spawnClock=2)}else{this.spawnClock=0;for(let d=0;d<this.alive&&this.driving>o;d++)this.leave(this.live[d])}let a=s.tiles.kind,l=s.size;for(let d=0;d<this.alive;d++){let h=this.live[d];if(this.mode[h]===1&&a[this.tile[h]]!==1&&this.leave(h),this.mode[h]===2){if(this.scale[h]-=r/Vx,this.scale[h]<=0){this.retire(h),d--;continue}}else this.scale[h]<1&&(this.scale[h]=Math.min(1,this.scale[h]+r/Vx));let f=(this.dout[h]-this.din[h]+4)%4,p=Sh[f],x=f===$T?WT:XT,g=this.s[h]+x*r/p,m=this.ahead[h];if(m>=0)if(this.mode[m]!==0&&this.tile[m]===this.tile[h]&&this.din[m]===this.din[h]){let b=Sh[(this.dout[m]-this.din[m]+4)%4],w=(this.s[m]*b-Gx)/p;g>w&&(g=Math.max(this.s[h],w))}else this.ahead[h]=-1;if(g>=1){let b=this.tile[h],w=this.dout[h],y=b%l+ni[w],_=(b/l|0)+ii[w],M=_*l+y;if(y<0||_<0||y>=l||_>=l||!this.isRoadIdx(M))g=1,this.leave(h);else{let A=M*4+w,v=this.slots[A],S=v>=0&&v!==h&&this.mode[v]!==0&&this.tile[v]===M&&this.din[v]===w,C=!1;if(S){let P=(this.dout[v]-this.din[v]+4)%4;C=P===ZT||this.s[v]*Sh[P]<Gx}C&&this.wait[h]<qT?(g=1,this.wait[h]+=r):(this.release(h),this.ahead[h]=S?v:-1,this.slots[A]=h,this.tile[h]=M,this.din[h]=w,this.dout[h]=this.chooseExit(M,w),this.wait[h]=0,g=Math.min(.5,(g-1)*p/Sh[(this.dout[h]-w+4)%4]))}}this.s[h]=g}this.counts.fill(0);let c=0,u=t!==null&&i>.03;for(let d=0;d<this.alive;d++){let h=this.live[d],f=this.tile[h];Wx(this.din[h],this.dout[h],Math.min(1,this.s[h]),this.tmp);let p=f%l+.5+this.tmp[0],x=(f/l|0)+.5+this.tmp[1],g=Math.atan2(this.tmp[2],this.tmp[3]),m=this.variant[h],b=this.meshes[m],w=this.scale[h];Cs(b.instanceMatrix.array,this.counts[m]*16,p,.004,x,g,w,w),this.counts[m]++,u&&t.setHeadlight(c++,p+Math.sin(g)*.36*w,x+Math.cos(g)*.36*w,g,w)}for(let d=0;d<Ds;d++){let h=this.meshes[d];h.count=this.counts[d],h.visible=h.count>0,h.count>0&&(h.instanceMatrix.needsUpdate=!0)}return c}carCount(){return this.alive}dispose(){for(let e of this.meshes)e.dispose(),e.geometry.dispose()}};var hp={low:{maxPixelRatio:1.5,shadows:!1,shadowMapSize:1024,shadowRadius:1,carShadows:!1,smoke:.5},medium:{maxPixelRatio:2,shadows:!0,shadowMapSize:2048,shadowRadius:2,carShadows:!1,smoke:.8},high:{maxPixelRatio:2.5,shadows:!0,shadowMapSize:2048,shadowRadius:2.5,carShadows:!0,smoke:1}};function Xx(n,e,t){let i=new Ru({canvas:n,antialias:!0,powerPreference:"high-performance",stencil:!1,alpha:!1});i.outputColorSpace=Wt,i.toneMapping=Ua,i.toneMappingExposure=1,i.shadowMap.type=Rr,i.shadowMap.enabled=!0;let s=new Ma;s.background=null;let r=new Pn(40,1,.5,400);r.name="world-camera";let o=Qg(),a=tx(),l=ex(o),c=Kg();c.texture.anisotropy=Math.min(8,i.capabilities.getMaxAnisotropy());let u=new wh;s.fog=u.fog,s.add(u.backdrop,u.sun,u.sun.target,u.hemi);let d=new sh;s.add(d.mesh);let h=new ah(c,a);s.add(h.group);let f=new rh;s.add(f.mesh);let p=new Ml(l,f);s.add(p.group);let x=new bh(512);s.add(x.mesh);let g=new yh(l,x,(k,z)=>{s.remove(k),s.add(z)});s.add(g.group);let m=new Th(l);s.add(m.group);let b=new lh;s.add(b.mesh);let w=new vh;s.add(w.group);let y=new _h(k=>p.ghostGeometry(k),o);s.add(y.group);let _=e,M=t,A=hp[M],v=Math.max(1,n.clientWidth||852),S=Math.max(1,n.clientHeight||393),C=1,P=0,D=-1,N=-1,I=!0,U=new Uint8Array(0),W=!1,O=new Da,te=new hi(new Z(0,1,0),0),X=new ft,q=new Z;function $(){let k=_.size,z=Math.PI/4,de=.9,Ee=Math.max(20,k*.65),ge=Math.cos(de)*Ee;r.position.set(k/2+Math.sin(z)*ge,Math.sin(de)*Ee,k/2+Math.cos(z)*ge),r.lookAt(k/2,0,k/2),r.updateMatrixWorld()}function he(){A=hp[M],i.setPixelRatio(Math.min(C,A.maxPixelRatio)),i.setSize(v,S,!1);let k=i.shadowMap.enabled!==A.shadows;i.shadowMap.enabled=A.shadows,u.sun.castShadow=A.shadows,u.sun.shadow.mapSize.x!==A.shadowMapSize&&(u.sun.shadow.mapSize.set(A.shadowMapSize,A.shadowMapSize),u.sun.shadow.map?.dispose(),u.sun.shadow.map=null),u.sun.shadow.radius=A.shadowRadius,p.setShadows(A.shadows),m.setShadows(A.shadows&&A.carShadows),h.setShadows(A.shadows),f.density=A.smoke,k&&s.traverse(z=>{let de=z.material;Array.isArray(de)?de.forEach(Ee=>Ee.needsUpdate=!0):de&&(de.needsUpdate=!0)})}function Q(k){let z=k.size*k.size;U=new Uint8Array(z);for(let de=0;de<z;de++)U[de]=k.tiles.kind[de]===1?1:0}function fe(k){_=k,k.dirty.clear(),h.setState(k),p.setState(k),m.setState(k),g.rebuild(k),w.setState(k),u.setMapSize(k.size),d.build(k.size),f.clear(),Q(k),D=k.rev.buildings,N=k.rev.derived,p.refreshActivity(),p.flush(),h.update(),I=!0,w.dirty=!0,y.setPreview(null,k),y.refreshSelection(k)}function re(k){let z=k.dirty;if(z.size===0)return;let de=Ml.animateFor(z.size),Ee=!1,ge=k.size;for(let Ue of z){if(Ue<0||Ue>=ge*ge)continue;h.markTile(Ue),p.updateTile(Ue,de);let vt=k.tiles.kind[Ue]===1?1:0;if(vt!==U[Ue]){U[Ue]=vt,Ee=!0;let G=Ue%ge,me=Ue/ge|0;for(let ke=0;ke<4;ke++)for(let xe=1;xe<=3;xe++){let Ve=G+th[ke]*xe,Je=me+nh[ke]*xe;if(Ve<0||Je<0||Ve>=ge||Je>=ge)continue;let dt=Je*ge+Ve;k.tiles.kind[dt]===2&&(p.updateTile(dt,!1),h.markChunkAt(Ve,Je))}}}z.clear(),Ee&&(m.rebuildRoads(),g.rebuild(k)),I=!0}let pe={renderer:i,scene:s,camera:r,resize(k,z,de){v=Math.max(1,Math.floor(k)),S=Math.max(1,Math.floor(z)),C=de>0?de:1,i.setPixelRatio(Math.min(C,A.maxPixelRatio)),i.setSize(v,S,!1),r.aspect=v/S,r.updateProjectionMatrix()},setQuality(k){hp[k]&&(M=k,he())},setOverlay(k){w.setKind(k),w.dirty&&w.rebuild(_)},setPreview(k){y.setPreview(k,_)},setSelection(k){y.setSelection(k,_)},setState(k){fe(k)},update(k,z){if(W)return;(z!==_||z.size*z.size!==U.length)&&fe(z);let de=Math.max(0,Math.min(.25,Number.isFinite(k)?k:0));P+=de,u.setTime(z.timeOfDay),o.uNight.value=u.night,o.uGlass.value.copy(u.glass),a.uTime.value=P,a.uNight.value=u.night,re(z),z.rev.buildings!==D&&(D=z.rev.buildings,p.syncBuildings(!0),I=!0,y.refreshSelection(z)),z.rev.derived!==N&&(N=z.rev.derived,p.refreshActivity(),I=!0,w.dirty=!0),h.update(),p.flush(),I&&(I=!1,b.rebuild(z,ge=>p.heightAt(ge))),w.dirty&&w.rebuild(z),p.tick(de,P),f.update(de,p.emitters,p.emitterCount,u.night),m.target=bg(z.stats.population,z.stats.jobsCom+z.stats.jobsInd);let Ee=m.update(de,x,u.night);x.commit(u.night,Ee),b.update(P,u.viewDistance),y.update(P),d.update(de)},render(){W||(r.updateMatrixWorld(),u.prepare(r,A.shadows,A.shadowMapSize),b.update(P,u.viewDistance),i.render(s,r))},pickTile(k,z){let de=v||n.clientWidth,Ee=S||n.clientHeight;if(!de||!Ee||(X.set(k/de*2-1,-(z/Ee)*2+1),r.updateMatrixWorld(),O.setFromCamera(X,r),!O.ray.intersectPlane(te,q)))return null;let ge=Math.floor(q.x),Ue=Math.floor(q.z);return ge<0||Ue<0||ge>=_.size||Ue>=_.size?null:{x:ge,z:Ue}},stats(){return{drawCalls:i.info.render.calls,triangles:i.info.render.triangles}},dispose(){W||(W=!0,h.dispose(),p.dispose(),m.dispose(),g.dispose(),x.dispose(),f.dispose(),b.dispose(),w.dispose(),y.dispose(),d.dispose(),u.dispose(),l.dispose(),c.texture.dispose(),i.dispose())}};return $(),he(),fe(e),u.setTime(e.timeOfDay),pe}function On(n,e,t){return n<e?e:n>t?t:n}function Sl(n,e,t,i,s,r){let o=n<t?t-n:n>t+s-1?n-(t+s-1):0,a=e<i?i-e:e>i+r-1?e-(i+r-1):0;return o*o+a*a}function qx(n,e){let{size:t}=n,i=n.tiles.kind;for(let s=e.x;s<e.x+e.w;s++)if(e.z-1>=0&&i[(e.z-1)*t+s]===1||e.z+e.h<t&&i[(e.z+e.h)*t+s]===1)return!0;for(let s=e.z;s<e.z+e.h;s++)if(e.x-1>=0&&i[s*t+e.x-1]===1||e.x+e.w<t&&i[s*t+e.x+e.w]===1)return!0;return!1}function $x(n,e,t,i,s){let{size:r}=n,o=n.tiles.terrain;for(let a=e;a<e+i;a++)if(!(a<0||a>=r)&&(t-1>=0&&o[(t-1)*r+a]===1||t+s<r&&t+s>=0&&o[(t+s)*r+a]===1))return!0;for(let a=t;a<t+s;a++)if(!(a<0||a>=r)&&(e-1>=0&&o[a*r+e-1]===1||e+i<r&&e+i>=0&&o[a*r+e+i]===1))return!0;return!1}function ps(n){let e=n<0,t=String(Math.round(Math.abs(n))),i="";for(let s=0;s<t.length;s++)s>0&&(t.length-s)%3===0&&(i+=","),i+=t[s];return(e?"-$":"$")+i}function Zx(n){return ps(n).replace("$","")}function JT(n){let e=Math.max(1,Math.floor(n*.6180339887))|1,t=(i,s)=>s===0?i:t(s,i%s);for(;t(e,n)!==1;)e+=2;return e}var Yx=new WeakMap;function Jo(n){let e=Yx.get(n);if(e&&e.size===n.size)return e;let t=n.size*n.size;return e={size:n.size,computed:!1,queue:new Int32Array(t),waterDist:new Uint8Array(t),treeNear:new Uint8Array(t),popNear:new Float32Array(t),pollutionF:new Float32Array(t),landF:new Float32Array(t),load:new Int32Array(t),key:new Int32Array(t),prio:new Uint8Array(t),reach:new Uint8Array(t),powerSrc:new Int32Array(t).fill(-1),waterSrc:new Int32Array(t).fill(-1),powerProducers:[],waterProducers:[],supplyUsed:new Map,upkeep:new Map,roadOk:new Map,powered:new Map,happinessTarget:50,happinessParts:{services:0,parks:0,landmarks:0,pollution:0,jobs:0,taxes:0,utilities:0},pop:0,jobsCom:0,jobsInd:0,changesSinceRecompute:0,lastToast:new Map,pairP:new Int32Array(8192),pairI:new Int32Array(8192),pairNext:new Int32Array(8192),bucketHead:new Int32Array(64),stride:JT(t)},Yx.set(n,e),e}var Kx=.4,jT=2,QT=3,eE=40,tE=10,nE=.7,iE=3,sE=6,rE=22,oE=8,aE=30,lE=45,cE=2.5,uE=25,eb=["services","parks","landmarks","pollution","jobs","taxes","utilities"];function qr(n,e,t,i,s){let r=n*Mf,a=((e+t)*1.15+rg-r)/Math.max(60,r*.5)+(i-50)/200,l=(n*ag-e)/Math.max(30,n*.12),c=(r*lg+og-t)/Math.max(40,r*.3),u=(d,h)=>On(On(d,-1,1)-(h-9)*cg,-1,1);return{res:u(a,s.res),com:u(l,s.com),ind:u(c,s.ind)}}function Jx(n,e,t,i){let s=n*n,r=0,o=0;for(let a=0;a<s;a++)i(a)?(e[a]=0,t[o++]=a):e[a]=255;for(;r<o;){let a=t[r++],l=e[a]+1;if(l>255)continue;let c=a%n;c>0&&e[a-1]>l&&(e[a-1]=l,t[o++]=a-1),c<n-1&&e[a+1]>l&&(e[a+1]=l,t[o++]=a+1),a>=n&&e[a-n]>l&&(e[a-n]=l,t[o++]=a-n),a<s-n&&e[a+n]>l&&(e[a+n]=l,t[o++]=a+n)}}function hE(n,e){if(e<=n.pairP.length)return;let t=n.pairP.length;for(;t<e;)t*=2;let i=s=>{let r=new Int32Array(t);return r.set(s),r};n.pairP=i(n.pairP),n.pairI=i(n.pairI),n.pairNext=i(n.pairNext)}function jx(n,e,t,i,s,r){let o=n.size,{reach:a,load:l,key:c,prio:u}=e;a.fill(0),r.fill(-1);let d=0;for(let m of t)d=Math.max(d,Math.floor(m.radius*m.radius));e.bucketHead.length<d+1&&(e.bucketHead=new Int32Array(d+1));let h=e.bucketHead;h.fill(-1,0,d+1);let f=0;for(let m=0;m<t.length;m++){let{b,radius:w}=t[m],y=Math.floor(w),_=w*w,M=Math.max(0,b.x-y),A=Math.min(o-1,b.x+b.w-1+y),v=Math.max(0,b.z-y),S=Math.min(o-1,b.z+b.h-1+y);for(let C=v;C<=S;C++)for(let P=M;P<=A;P++){let D=Sl(P,C,b.x,b.z,b.w,b.h);if(D>_)continue;let N=C*o+P;a[N]=1,!(l[N]<=0)&&(f>=e.pairP.length&&hE(e,f+1),e.pairP[f]=m,e.pairI[f]=N,e.pairNext[f]=h[D],h[D]=f++)}}let{pairP:p,pairI:x,pairNext:g}=e;for(let m=0;m<i;m++)for(let b=0;b<=d;b++)for(let w=h[b];w>=0;w=g[w]){let y=x[w];if(u[y]!==m)continue;let _=c[y];if(s[_])continue;let M=t[p[w]],A=l[y];M.remain>=A&&(M.remain-=A,s[_]=1)}for(let m=0;m<t.length;m++){let{b,radius:w,remain:y}=t[m],_=Math.floor(w),M=w*w,A=Math.max(0,b.x-_),v=Math.min(o-1,b.x+b.w-1+_),S=Math.max(0,b.z-_),C=Math.min(o-1,b.z+b.h-1+_);for(let P=S;P<=C;P++)for(let D=A;D<=v;D++){if(Sl(D,P,b.x,b.z,b.w,b.h)>M)continue;let N=P*o+D,I=r[N];(I<0||y>t[I].remain)&&(r[N]=m)}}}function dp(n,e,t,i,s){if(s<=0||i===0)return;let r=Math.ceil(s),o=Math.max(0,t.x-r),a=Math.min(n-1,t.x+t.w-1+r),l=Math.max(0,t.z-r),c=Math.min(n-1,t.z+t.h-1+r);for(let u=l;u<=c;u++)for(let d=o;d<=a;d++){let h=Math.sqrt(Sl(d,u,t.x,t.z,t.w,t.h));h>=s||(e[u*n+d]+=i*(1-h/s))}}function dE(n,e,t,i){let s=Math.ceil(i),r=Math.max(0,t.x-s),o=Math.min(n-1,t.x+t.w-1+s),a=Math.max(0,t.z-s),l=Math.min(n-1,t.z+t.h-1+s);for(let c=a;c<=l;c++)for(let u=r;u<=o;u++){let d=Math.sqrt(Sl(u,c,t.x,t.z,t.w,t.h));if(d>=i)continue;let h=Math.round(255*(1-d/i)),f=c*n+u;h>e[f]&&(e[f]=h)}}function Qx(n,e,t,i,s,r,o){let{kind:a,zone:l,level:c}=n.tiles,{load:u,key:d,reach:h}=e;for(let f=0;f<t.length;f++)if(u[f]>0)t[f]=i[d[f]];else if(!h[f])t[f]=0;else{let p=a[f];if(p===0||p===2&&c[f]===0){let x=p===2&&fp(l[f])?o[l[f]][1]:1,g=r[f]>=0?s[r[f]]:void 0;t[f]=g&&g.remain>=x?1:0}else t[f]=1}}function fE(n,e){let t=nt[e.type],i=t.power?.capacity??t.water?.capacity;if(!i)return t.upkeep;let s=e.active?Math.min(1,(n.supplyUsed.get(e.id)??0)/i):0;return Math.round(t.upkeep*(Kx+(1-Kx)*s))}function fp(n){return n===1||n===2||n===3}function bi(n){let e=Jo(n),t=n.size,i=t*t,s=n.tiles,{kind:r,zone:o,level:a,terrain:l,trees:c}=s;Jx(t,s.roadDist,e.queue,G=>r[G]===1),Jx(t,e.waterDist,e.queue,G=>l[G]===1);for(let G=0;G<t;G++)for(let me=0;me<t;me++){let ke=0;for(let xe=-2;xe<=2&&!ke;xe++){let Ve=G+xe;if(!(Ve<0||Ve>=t))for(let Je=-2;Je<=2;Je++){let dt=me+Je;if(dt>=0&&dt<t&&c[Ve*t+dt]){ke=1;break}}}e.treeNear[G*t+me]=ke}let u=[];for(let G of n.buildings)G&&u.push(G);e.roadOk.clear(),e.powered.clear(),e.supplyUsed.clear();for(let G of u){let me=nt[G.type];e.roadOk.set(G.id,!me.needsRoad||qx(n,G))}let d=new Uint8Array(i+n.buildings.length),{load:h,key:f,prio:p}=e;h.fill(0),p.fill(0);let x=0;for(let G=0;G<i;G++)f[G]=G,r[G]===2&&a[G]>0&&fp(o[G])&&(h[G]=hr[o[G]][a[G]],x+=h[G]);for(let G of u){if(!nt[G.type].needsPower||!e.roadOk.get(G.id))continue;let ke=jT*G.w*G.h;x+=ke;for(let xe=G.z;xe<G.z+G.h;xe++)for(let Ve=G.x;Ve<G.x+G.w;Ve++){let Je=xe*t+Ve;h[Je]=ke,f[Je]=i+G.id}}let g=[],m=0;for(let G of u){let me=nt[G.type];!me.power||!e.roadOk.get(G.id)||(g.push({id:G.id,b:G,capacity:me.power.capacity,radius:me.power.radius,remain:me.power.capacity}),m+=me.power.capacity)}jx(n,e,g,1,d,e.powerSrc),Qx(n,e,s.power,d,g,e.powerSrc,hr);for(let G of g)e.supplyUsed.set(G.id,G.capacity-G.remain);e.powerProducers=g;let b=!1;for(let G of u){let me=nt[G.type],ke=e.roadOk.get(G.id),xe=!me.needsPower||ke&&d[i+G.id]===1;e.powered.set(G.id,xe);let Ve=ke&&xe;G.active!==Ve&&(G.active=Ve,b=!0)}b&&n.rev.buildings++,d.fill(0),h.fill(0),p.fill(0);let w=0;for(let G=0;G<i;G++)f[G]=G,r[G]===2&&a[G]>0&&fp(o[G])&&(h[G]=dr[o[G]][a[G]],w+=h[G],p[G]=a[G]>=Hi?0:1);let y=[],_=0;for(let G of u){let me=nt[G.type];!me.water||!G.active||(y.push({id:G.id,b:G,capacity:me.water.capacity,radius:me.water.radius,remain:me.water.capacity}),_+=me.water.capacity)}jx(n,e,y,2,d,e.waterSrc),Qx(n,e,s.water,d,y,e.waterSrc,dr);for(let G of y)e.supplyUsed.set(G.id,G.capacity-G.remain);e.waterProducers=y;for(let G of Xg)s[G].fill(0);let M=e.pollutionF,A=e.landF;M.fill(0),A.fill(0);let v=0;for(let G of u){if(!G.active)continue;let me=nt[G.type];me.service&&dE(t,s[me.service.kind],G,me.service.radius),me.pollution&&dp(t,M,G,me.pollution.amount,me.pollution.radius),me.landValue&&dp(t,A,G,me.landValue.amount,me.landValue.radius),me.happiness&&(v+=me.happiness)}let S={x:0,z:0,w:1,h:1};for(let G=0;G<i;G++)r[G]===2&&o[G]===3&&a[G]>0&&(S.x=G%t,S.z=(G-S.x)/t,dp(t,M,S,gg[a[G]]??0,xg));for(let G=0;G<t;G++)for(let me=0;me<t;me++){let ke=G*t+me,xe=M[ke];if(xe>0){let Ve=0;for(let Je=-1;Je<=1;Je++){let dt=G+Je;if(!(dt<0||dt>=t))for(let _t=-1;_t<=1;_t++){let Dt=me+_t;Dt>=0&&Dt<t&&c[dt*t+Dt]&&Ve++}}xe-=Ve*iE}s.pollution[ke]=On(Math.round(xe),0,255)}for(let G=0;G<i;G++){let me=fg;l[G]!==1&&e.waterDist[G]<=QT&&(me+=pg),e.treeNear[G]&&(me+=mg),me+=s.parks[G]/255*eE,me+=(s.police[G]+s.fire[G]+s.health[G]+s.education[G])/255*tE,me+=A[G],me-=s.pollution[G]*nE,s.landValue[G]=On(Math.round(me),0,255)}{let G=t+1,me=new Float64Array(G*G);for(let xe=0;xe<t;xe++){let Ve=0;for(let Je=0;Je<t;Je++){let dt=xe*t+Je;r[dt]===2&&o[dt]===1&&(Ve+=kr[a[dt]]??0),me[(xe+1)*G+Je+1]=me[xe*G+Je+1]+Ve}}let ke=sE;for(let xe=0;xe<t;xe++){let Ve=Math.max(0,xe-ke),Je=Math.min(t,xe+ke+1);for(let dt=0;dt<t;dt++){let _t=Math.max(0,dt-ke),Dt=Math.min(t,dt+ke+1);e.popNear[xe*t+dt]=me[Je*G+Dt]-me[Ve*G+Dt]-me[Je*G+_t]+me[Ve*G+_t]}}}let C=0,P=0,D=0,N=0,I=0,U=0,W=0,O=0,te=0,X=0,q=0;for(let G=0;G<i;G++){let me=r[G],ke=0;if(me===1)W++;else if(me===2){let xe=a[G],Ve=o[G];if(s.roadDist[G]>pi&&(ke|=4),s.power[G]||(ke|=1),xe>0)if(s.water[G]||(ke|=2),(!s.power[G]||xe>=Hi&&!s.water[G])&&O++,Ve===1){let Je=kr[xe]??0;C+=Je,N++,s.pollution[G]>=tl&&(ke|=8),te+=Je*((s.police[G]+s.fire[G]+s.health[G]+s.education[G])/1020),X+=Je*(s.parks[G]/255),q+=Je*Math.min(1,s.pollution[G]/150)}else Ve===2?(P+=Ho[xe]??0,I++):Ve===3&&(D+=Go[xe]??0,U++)}else if(me===3){let xe=n.buildings[s.bld[G]];if(xe){let Ve=nt[xe.type];xe.active||(ke|=16),Ve.needsRoad&&!e.roadOk.get(xe.id)&&(ke|=4),Ve.needsPower&&!e.powered.get(xe.id)&&(ke|=1)}}s.problems[G]=ke}let $=n.stats,he=C*Mf,Q=P+D,fe=he>0?On((he-Q)/he,0,1):0,re=e.happinessParts;re.services=C>0?rE*te/C:0,re.parks=C>0?oE*X/C:0,re.pollution=C>0?-(aE*q)/C:0,re.landmarks=v,re.jobs=-lE*Math.max(0,fe-.05);let pe=.5*(n.taxes.res-9)+.25*(n.taxes.com-9)+.25*(n.taxes.ind-9);re.taxes=-cE*pe;let k=N+I+U;re.utilities=k>0?-(uE*O)/k:0;let z=50;for(let G of eb)z+=re[G];e.happinessTarget=On(z,0,100),$.happiness=On(Number.isFinite($.happiness)?$.happiness:50,0,100),$.population=C,$.workforce=Math.round(he),$.jobsCom=P,$.jobsInd=D,$.unemployment=fe,$.demand=qr(C,P,D,$.happiness,n.taxes),$.powerSupply=m,$.powerDemand=x,$.waterSupply=_,$.waterDemand=w;let de=Math.round(C*n.taxes.res*ug),Ee=Math.round(P*n.taxes.com*hg),ge=Math.round(D*n.taxes.ind*dg);$.income={res:de,com:Ee,ind:ge,total:de+Ee+ge};let Ue=0;e.upkeep.clear();for(let G of u){let me=fE(e,G);e.upkeep.set(G.id,me),Ue+=me}let vt=Math.round(W*zu);$.expenses={roads:vt,buildings:Ue,total:vt+Ue},$.developed={res:N,com:I,ind:U},e.pop=C,e.jobsCom=P,e.jobsInd=D,e.changesSinceRecompute=0,e.computed=!0,n.needsRecompute=!1,n.rev.derived++}var pE=.12,mE=[0,2,.3,.38],pp=-.3,tb=.008,Eh=35,gE=3,xE=400;function Tl(n,e,t,i){let s=n.tiles,r=s.landValue[t]/255,o=s.pollution[t]/255,a=(s.police[t]+s.fire[t]+s.health[t]+s.education[t])/1020;if(i===1)return On(.06+1.1*r+.12*a+.08*(s.parks[t]/255)-.6*o,0,1);if(i===2){let l=Math.min(1,e.popNear[t]/xE);return On(.12+.9*r+.35*l+.05*a,0,1)}if(i===3){let l=s.roadDist[t],c=l<=1?1:l===2?.55:.25,u=(s.fire[t]+s.police[t])/510,d=Math.min(1,(s.landValue[t]+s.pollution[t]*.7)/255);return On(.2+.22*c+.25*u+.3*d,0,1)}return 0}function bE(n,e){return e===1?n.res:e===2?n.com:e===3?n.ind:0}function nb(n,e,t,i){e===1?n.pop+=i*(kr[t]??0):e===2?n.jobsCom+=i*(Ho[t]??0):e===3&&(n.jobsInd+=i*(Go[t]??0))}function yE(n,e,t){let i=n.tiles,s=i.level[t];return!(i.roadDist[t]>pi||!i.power[t]||s>=Hi&&!i.water[t]||s>=2&&Tl(n,e,t,i.zone[t])<el[s]-pE)}function El(n,e,t){let i=n.tiles,s=i.level[t],r=i.zone[t];if(s>=3)return"max";let o=s+1;if(i.roadDist[t]>pi)return"road";if(!i.power[t])return e.powerSrc[t]>=0?"powerCap":"power";let a=e.powerSrc[t],l=(hr[r]?.[o]??0)-(s>0?hr[r]?.[s]??0:0);if(a<0||!e.powerProducers[a]||e.powerProducers[a].remain<l)return"powerCap";if(o>=Hi){if(!i.water[t])return e.waterSrc[t]>=0?"waterCap":"water";let c=e.waterSrc[t],u=(dr[r]?.[o]??0)-(s>0?dr[r]?.[s]??0:0);if(c<0||!e.waterProducers[c]||e.waterProducers[c].remain<u)return"waterCap"}return Tl(n,e,t,r)<el[o]?"desire":null}function vE(n,e,t){return Math.floor(ve(n.seed^1779033703,n.day*4+t,e)*256)}function ib(n,e){let t=n.tiles,i=n.size*n.size,{kind:s,zone:r,level:o,distress:a}=t,l=0,c=0,u=qr(e.pop,e.jobsCom,e.jobsInd,n.stats.happiness,n.taxes),d=Math.floor(ve(n.seed,n.day,23719)*i),h=e.stride,f=n.seed^1013904242,p=n.seed^528734635,x=Math.max(0,(Eh-n.stats.happiness)/Eh),g=(m,b,w,y)=>{nb(e,b,w,-1),nb(e,b,y,1);let _=e.powerSrc[m];_>=0&&e.powerProducers[_]&&(e.powerProducers[_].remain-=(hr[b]?.[y]??0)-(hr[b]?.[w]??0));let M=e.waterSrc[m];M>=0&&e.waterProducers[M]&&(y>=Hi||w>=Hi||t.water[m])&&(e.waterProducers[M].remain-=(dr[b]?.[y]??0)-(dr[b]?.[w]??0)),o[m]=y,t.variant[m]=vE(n,m,y),a[m]=0,Nr(n,m),l++,e.changesSinceRecompute++,u=qr(e.pop,e.jobsCom,e.jobsInd,n.stats.happiness,n.taxes),c<gE&&(c++,Nn({type:"grew",i:m,level:y,up:y>w}))};for(let m=0,b=d;m<i;m++,b=(b+h)%i){if(s[b]!==2)continue;let w=r[b];if(w!==1&&w!==2&&w!==3)continue;let y=o[b],_=bE(u,w);if(y>0){if(!yE(n,e,b)){let S=a[b];a[b]=Math.min(255,S+1),S===0&&Nr(n,b),a[b]>=sg&&g(b,w,y,y-1);continue}a[b]!==0&&(a[b]=0,Nr(n,b));let v=_<pp?tb*((pp-_)/(1+pp)):0;if(w===1&&x>0&&(v+=tb*x),v>0&&ve(p,n.day,b)<v){g(b,w,y,y-1);continue}}if(y>=3||_<=0||El(n,e,b)!==null)continue;let M=Tl(n,e,b,w),A=ig*Math.sqrt(Math.min(1,_))*(.35+.65*M)*mE[y+1];ve(f,n.day,b)<A&&g(b,w,y,y+1)}return l}var _E=6;function ME(n,e){return ju.filter(t=>nt[t].unlockPop>n&&nt[t].unlockPop<=e)}function sb(n){let e=n.stats.population;for(;n.milestone+1<Mn.length&&e>=Mn[n.milestone+1].population;){let t=Mn[n.milestone];n.milestone++;let i=Mn[n.milestone];n.money+=i.reward;let s=ME(t.population,i.population);Nn({type:"milestone",index:n.milestone,name:i.name,reward:i.reward,unlocked:s});let r=s.map(a=>nt[a].name),o=`${n.name} is now a ${i.name}!`;i.reward>0&&(o+=` +${ps(i.reward)}.`),r.length&&(o+=` New: ${r.join(", ")}.`),Nn({type:"toast",text:o,tone:"good"})}}function wE(n){return Math.floor(n.day/Ts)}function Xn(n,e,t,i,s){let r=wE(n),o=e.lastToast.get(t);return o!==void 0&&r-o<_E?!1:(e.lastToast.set(t,r),Nn({type:"toast",text:i,tone:s}),!0)}function SE(n,e){let t=n.stats,i=n.tiles,s=n.size*n.size,r=0,o=0,a=0,l=0,c=0,u=0,d=0,h=0;for(let g=0;g<s;g++){if(i.kind[g]!==2)continue;r++;let m=i.level[g];if(m>0&&o++,i.problems[g]&4?l++:i.problems[g]&1&&a++,m===1&&i.zone[g]===1&&!i.water[g]&&c++,m>=2&&!i.water[g]&&u++,m>0&&m<3){let b=El(n,e,g);b==="powerCap"?d++:b==="waterCap"&&h++}}let f=e.powerProducers.length>0,p=e.waterProducers.length>0;if(r>=8&&!f?Xn(n,e,"power","Zones need power to grow. Build a power plant near them.","bad"):t.powerDemand>t.powerSupply&&f?Xn(n,e,"power","Power plants are at full capacity. Build another plant so the city can keep growing.","bad"):a>=6&&f?Xn(n,e,"powerReach","Some lots have no power: they are out of reach or the plants near them are full. Build a power plant close by.","bad"):d>=8&&Xn(n,e,"powerReach","The power plants near some buildings are full, so they cannot grow. Build another plant near them.","info"),c>=10&&!p?Xn(n,e,"water","Homes cannot grow past cottages without water. Build a water tower next to a road.","info"):t.waterDemand>t.waterSupply&&p?Xn(n,e,"water","Water demand is higher than supply. Add a water tower or a pump.","bad"):u>=4&&p?Xn(n,e,"waterReach","Some buildings have no water. Put a water tower closer to them.","bad"):h>=8&&Xn(n,e,"waterReach","The water supply near some buildings is used up, so they cannot grow. Add a water tower or pump.","info"),l>=10&&Xn(n,e,"road","Some zoned lots are too far from a road. Zones need a road within 3 tiles.","info"),n.money<0?Xn(n,e,"debt","The treasury is in the red. Raise taxes a little or cut costly buildings.","bad"):n.monthsInDebt===0&&t.income.total<t.expenses.total&&n.money<2e3&&o>0&&Xn(n,e,"lowcash","Money is running low and the city is losing money each month.","bad"),t.population>=40&&t.happiness<Eh+5){let g=e.happinessParts,m=["jobs","taxes","utilities","pollution"].reduce((y,_)=>g[_]<g[y]?_:y),b={jobs:"there are not enough jobs. Zone more industry or shops",taxes:"taxes are too high. Lower them a little",utilities:"homes are missing power or water. Fix the supply",pollution:"pollution reaches their homes. Keep industry and smokestacks away"},w=g[m]<-3?b[m]:"the city lacks services. Build police, fire, clinics, schools and parks";Xn(n,e,"unhappy",`People are unhappy and starting to leave: ${w}.`,"bad")}let x=t.jobsCom+t.jobsInd;t.population>=40&&x===0?Xn(n,e,"jobs","Your residents need jobs. Zone some industry or shops.","info"):t.workforce>=60&&t.unemployment>.2&&Xn(n,e,"jobs","Many people are out of work. Zone more industry or shops.","bad")}function rb(n,e){let t=n.stats,i=t.income.total-t.expenses.total;n.money=Math.round(n.money+i),n.monthsInDebt=n.money<0?n.monthsInDebt+1:0;let s={day:n.day,population:t.population,money:n.money,income:t.income.total,expenses:t.expenses.total,happiness:Math.round(t.happiness)};n.history.push(s),n.history.length>Qa&&n.history.splice(0,n.history.length-Qa),Nn({type:"month",record:s}),i>0&&t.population>0&&n.history.slice(0,-1).every(r=>r.income<=r.expenses||r.population===0)&&Xn(n,e,"profit",`The city made a profit this month: +${ps(i)}. Keep it up!`,"good"),SE(n,e)}function ob(n){return n*n*(3-2*n)}function TE(n,e,t){let i=Math.floor(e),s=Math.floor(t),r=ob(e-i),o=ob(t-s),a=ve(n,i,s),l=ve(n,i+1,s),c=ve(n,i,s+1),u=ve(n,i+1,s+1);return a+(l-a)*r+(c-a)*o+(a-l-c+u)*r*o}function Al(n,e,t,i){let s=0,r=1,o=0,a=1;for(let l=0;l<i;l++)s+=TE(n+l*1013,e*a,t*a)*r,o+=r,r*=.5,a*=2;return s/o}function mp(n,e,t=3){return Al(n,e,7.31,t)}function EE(n){let e=n();return e<.28?{river:!0,coast:-1,lakes:n()<.4?1:0}:e<.52?{river:!1,coast:-1,lakes:2+Math.floor(n()*2)}:e<.72?{river:!1,coast:Math.floor(n()*4),lakes:1+Math.floor(n()*2)}:e<.88?{river:!0,coast:Math.floor(n()*4),lakes:n()<.3?1:0}:{river:!0,coast:-1,lakes:1+Math.floor(n()*2)}}function AE(n){return Math.max(4,Math.round(n*.17))}function ab(n,e,t,i,s,r,o){let a=Math.max(0,Math.floor(t-s-1)),l=Math.min(e-1,Math.ceil(t+s+1)),c=Math.max(0,Math.floor(i-s-1)),u=Math.min(e-1,Math.ceil(i+s+1)),d=s*s;for(let h=c;h<=u;h++)for(let f=a;f<=l;f++){let p=f+.5-t,x=h+.5-i;if(p*p+x*x>d)continue;let g=f+.5-r,m=h+.5-r;g*g+m*m<o*o||(n[h*e+f]=1)}}function RE(n,e,t,i,s,r){let o=e/2,l=(i()<.5?-1:1)*(e*.19+i()*e*.12),c=(i()-.5)*.4,u=2.5+i()*3.5,d=Math.PI*2/(28+i()*18),h=i()*Math.PI*2,f=.8+i()*1.5,p=Math.PI*2/(11+i()*7),x=i()*Math.PI*2,g=t^5370206;for(let m=-6;m<=e+6;m+=.25){let w=(2.2+1.9*mp(g,m/14))/2,y=o+l+c*(m-o)+u*Math.sin(d*m+h)+f*Math.sin(p*m+x),_=m-o,M=r+w+1;if(Math.abs(_)<M){let A=Math.sqrt(M*M-_*_);Math.abs(y-o)<A&&(y=o+Math.sign(l)*A)}s===0?ab(n,e,m,y,w,o,r):ab(n,e,y,m,w,o,r)}}function CE(n,e,t,i,s){let r=e*(.06+i()*.05),o=e*(.07+i()*.07),a=t^789079,l=i()*e,c=e*(.08+i()*.1),u=(i()<.5?1:-.6)*e*(.04+i()*.05);for(let d=0;d<e;d++){let h=u*Math.exp(-(((d-l)/c)**2)),f=Math.max(1.5,r+o*1.8*(mp(a,d/13,4)-.35)+1.6*mp(a+9,d/3,2)+h);for(let p=0;p<e&&!(p+.5>f);p++){let x,g;s===0?[x,g]=[d,p]:s===2?[x,g]=[d,e-1-p]:s===3?[x,g]=[p,d]:[x,g]=[e-1-p,d],n[g*e+x]=1}}}function PE(n,e,t,i,s,r){let o=e/2,a=e*(.055+i()*.07),l=0,c=0,u=!1;for(let y=0;y<40&&!u;y++)l=a+2+i()*(e-2*a-4),c=a+2+i()*(e-2*a-4),Math.hypot(l-o,c-o)>=s+a+2&&(u=!0);if(!u)return;let d=.7+i()*.6,h=i()*Math.PI,f=Math.cos(h),p=Math.sin(h),x=t^6718+r*7919,g=Math.max(0,Math.floor(l-a*2)),m=Math.min(e-1,Math.ceil(l+a*2)),b=Math.max(0,Math.floor(c-a*2)),w=Math.min(e-1,Math.ceil(c+a*2));for(let y=b;y<=w;y++)for(let _=g;_<=m;_++){let M=_+.5-l,A=y+.5-c,v=(M*f+A*p)*d,S=(-M*p+A*f)/d,C=Math.sqrt(v*v+S*S)/a,P=(Al(x,_/4.5,y/4.5,3)-.5)*.9;if(C+P<1){let D=_+.5-o,N=y+.5-o;D*D+N*N>=s*s&&(n[y*e+_]=1)}}}function lb(n,e){let t=new Uint8Array(n);for(let i=0;i<e;i++)for(let s=0;s<e;s++){let r=i*e+s,o=0;for(let a=-1;a<=1;a++)for(let l=-1;l<=1;l++){if(!l&&!a)continue;let c=s+l,u=i+a;c<0||u<0||c>=e||u>=e?o+=n[r]:o+=n[u*e+c]}n[r]&&o<=2?t[r]=0:!n[r]&&o>=6&&(t[r]=1)}n.set(t)}function IE(n,e,t){let i=e*e,s=new Uint8Array(i),r=[],o=[];for(let a=0;a<i;a++)if(!(!n[a]||s[a])){for(o.length=0,r.push(a),s[a]=1;r.length;){let l=r.pop();o.push(l);let c=l%e,u=(l-c)/e;c>0&&n[l-1]&&!s[l-1]&&(s[l-1]=1,r.push(l-1)),c<e-1&&n[l+1]&&!s[l+1]&&(s[l+1]=1,r.push(l+1)),u>0&&n[l-e]&&!s[l-e]&&(s[l-e]=1,r.push(l-e)),u<e-1&&n[l+e]&&!s[l+e]&&(s[l+e]=1,r.push(l+e))}if(o.length<t)for(let l of o)n[l]=0}}function cb(n,e,t,i){let s=new Uint8Array(n*n),r=AE(n);if(t.coast>=0&&CE(s,n,e,i,t.coast),t.river){let o;t.coast===0||t.coast===2?o=1:t.coast===1||t.coast===3?o=0:o=i()<.5?0:1,RE(s,n,e,i,o,r)}for(let o=0;o<t.lakes;o++)PE(s,n,e,i,r,o);return lb(s,n),lb(s,n),IE(s,n,5),s}function ub(n){let{size:e,seed:t}=n,i=e*e,s=n.tiles,r=kn((t^1592594996)>>>0),o=EE(r),a=cb(e,t,o,r),l=w=>w.reduce((y,_)=>y+_,0)/i;for(;l(a)>.3&&(o.lakes>0||o.coast>=0);)o.lakes>0?o.lakes--:o.coast=-1,a=cb(e,t,o,kn((t^31249)>>>0));for(let w=0;w<i;w++)s.terrain[w]=a[w]?1:0,s.trees[w]=0,s.kind[w]=0,s.zone[w]=0,s.level[w]=0,s.bld[w]=-1,s.distress[w]=0,s.variant[w]=Math.floor(ve(t,w,122)*256);let c=t^23085;for(let w=0;w<e;w++)for(let y=0;y<e;y++){let _=w*e+y;if(a[_])continue;let M=!1,A=!1;for(let S=-1;S<=1;S++)for(let C=-1;C<=1;C++){if(!C&&!S)continue;let P=y+C,D=w+S;P<0||D<0||P>=e||D>=e||a[D*e+P]&&(C===0||S===0?M=!0:A=!0)}if(!M&&!A)continue;let v=Al(c,y/6,w/6,2);(M&&v>.22||A&&v>.45)&&(s.terrain[_]=2)}let u=t^31294,d=.2+r()*.1,h=e/2,f=Math.max(3,e*.125),p=Math.max(2,e*.08),x=new Float32Array(i).fill(-1/0),g=0,m=[];for(let w=0;w<e;w++)for(let y=0;y<e;y++){let _=w*e+y;if(s.terrain[_]===1||(g++,s.terrain[_]!==0))continue;let M=Math.hypot(y+.5-h,w+.5-h);if(M<f)continue;let A=Al(u,y/9,w/9,4)+.22*Al(u+77,y/3.2,w/3.2,2);M<f+p&&(A-=(1-(M-f)/p)*.5),x[_]=A,m.push(_)}let b=Math.min(m.length,Math.round(g*d));if(b>0){let w=m.map(M=>x[M]).sort((M,A)=>A-M),y=w[b-1],_=Math.max(1e-6,w[0]-y);for(let M of m){let A=x[M];if(A>=y){let v=(A-y)/_+(ve(t,M,62)-.5)*.25;s.trees[M]=v>.45?3:v>.18?2:1}else ve(t,M,270)<.012&&(s.trees[M]=1)}}}var LE={1:["Empty lot","Cottage","Apartments","Tower"],2:["Empty lot","Corner Shop","Shopping Block","Office Tower"],3:["Empty lot","Workshop","Factory","Industrial Works"]},DE={1:"Homes",2:"Shops",3:"Industry"},kE={police:"Police",fire:"Fire",health:"Health",education:"Education",parks:"Parks"};function NE(n,e){return LE[n]?.[e]??"Lot"}function UE(n,e,t,i){return n<e?i[0]:n<t?i[1]:i[2]}function OE(n){return UE(n,85,140,["Low","Medium","High"])}function db(n){let e=OE(n);return{label:"Land value",value:e,tone:e==="High"?"good":"neutral"}}function gp(n,e=!0){return n<10?{label:"Pollution",value:"Clean air",tone:e?"good":"neutral"}:n<45?{label:"Pollution",value:"A little",tone:"neutral"}:{label:"Pollution",value:n<tl?"Noticeable":"Heavy",tone:e?"bad":"neutral"}}function FE(n,e){let t=n.tiles,i=[];for(let s of["police","fire","health","education","parks"])t[s][e]>=40&&i.push(kE[s]);return{label:"Nearby",value:i.length?i.join(", "):"No services yet",tone:i.length>=3?"good":"neutral"}}function hb(n,e,t="No"){return{label:n,value:e?"Yes":t,tone:e?"good":"bad"}}function BE(n,e,t){let i=nt[e.type],s=n.supplyUsed.get(e.id)??0;i.power&&(t.push({label:"Power supplied",value:e.active?`${s} / ${i.power.capacity}`:`0 / ${i.power.capacity}`,tone:s>=i.power.capacity?"bad":"neutral"}),t.push({label:"Reach",value:`${i.power.radius} tiles`})),i.water&&(t.push({label:"Water supplied",value:e.active?`${s} / ${i.water.capacity}`:`0 / ${i.water.capacity}`,tone:s>=i.water.capacity?"bad":"neutral"}),t.push({label:"Reach",value:`${i.water.radius} tiles`}))}function zE(n,e,t){let i=n.tiles,s=n.size,r=0,o=Math.ceil(t);for(let a=Math.max(0,e.z-o);a<=Math.min(s-1,e.z+e.h-1+o);a++)for(let l=Math.max(0,e.x-o);l<=Math.min(s-1,e.x+e.w-1+o);l++){let c=a*s+l;if(i.kind[c]!==2||i.level[c]===0||i.zone[c]!==1)continue;let u=l<e.x?e.x-l:l>e.x+e.w-1?l-(e.x+e.w-1):0,d=a<e.z?e.z-a:a>e.z+e.h-1?a-(e.z+e.h-1):0;u*u+d*d<t*t&&r++}return r}function fb(n,e){return n.powerProducers.length===0?"No power: place a power plant within reach.":n.powerSrc[e]>=0?"No power: the power plants in reach are full. Build another plant nearby.":"No power: out of reach of your power plants. Build one closer."}function HE(n,e,t,i){let s=nt[t.type];i.title=s.name,i.subtitle=s.blurb,i.buildingId=t.id;let r=e.roadOk.get(t.id)??!0,o=e.powered.get(t.id)??!0;if(i.rows.push({label:"Status",value:t.active?"Working":"Not working",tone:t.active?"good":"bad"}),BE(e,t,i.rows),s.service){let l=zE(n,t,s.service.radius);i.rows.push({label:"Covers",value:`${s.service.radius} tiles around it`}),i.rows.push({label:"Homes served",value:t.active?String(l):"0"})}s.landValue&&i.rows.push({label:"Lifts land value",value:`${s.landValue.radius} tiles around it`,tone:"good"}),s.happiness&&i.rows.push({label:"City happiness",value:`+${s.happiness}`,tone:"good"}),s.pollution&&i.rows.push({label:"Pollution",value:s.pollution.amount>=150?"Heavy":"Some",tone:"bad"});let a=e.upkeep.get(t.id)??s.upkeep;i.rows.push({label:"Upkeep",value:s.power||s.water?`${ps(a)} / month (up to ${ps(s.upkeep)} at full load)`:`${ps(a)} / month`}),s.needsRoad&&!r&&i.problems.push("No road: lay a road along one of its sides."),s.needsPower&&!o&&(r?i.problems.push(fb(e,t.z*n.size+t.x)):i.problems.push("No power: it needs a road before it can draw power.")),s.power&&t.active&&(e.supplyUsed.get(t.id)??0)>=s.power.capacity*.98&&i.problems.push("At full capacity: build another power plant."),s.water&&t.active&&(e.supplyUsed.get(t.id)??0)>=s.water.capacity*.98&&i.problems.push("At full capacity: build another water tower or a pump.")}function GE(n,e,t,i){let s=n.tiles,r=s.zone[t],o=s.level[t],a=DE[r]??"Zone",l=s.roadDist[t]<=pi,c=r===1?n.stats.demand.res:r===2?n.stats.demand.com:n.stats.demand.ind;if(o===0?(i.title=`${a} lot`,i.subtitle="Zoned and waiting to be built on."):(i.title=NE(r,o),i.subtitle=`${a}, level ${o} of 3`,r===1?i.rows.push({label:"Residents",value:String(kr[o]??0)}):r===2?i.rows.push({label:"Jobs",value:String(Ho[o]??0)}):i.rows.push({label:"Jobs",value:String(Go[o]??0)})),i.rows.push(db(s.landValue[t])),i.rows.push(hb("Power",s.power[t]===1)),(o>0||s.water[t])&&i.rows.push(o>=Hi||s.water[t]?hb("Water",s.water[t]===1):{label:"Water",value:"No (needed to grow)",tone:"neutral"}),i.rows.push(gp(s.pollution[t],r!==3)),i.rows.push(FE(n,t)),l||i.problems.push(`No road within ${pi} tiles: lay a road closer.`),s.power[t]||i.problems.push(fb(e,t)),o>=Hi&&!s.water[t]&&i.problems.push(e.waterSrc[t]>=0?"No water: the water supply here is used up. Add a water tower or pump, or this building will shrink.":"No water: build a water tower within reach, or this building will shrink."),r===1&&o>0&&s.pollution[t]>=tl&&i.problems.push("Too much pollution: keep factories and power plants away from homes."),s.distress[t]>0&&o>0&&i.problems.push("Struggling: if this goes on it will drop a level."),o<3&&l&&s.power[t]){let u=El(n,e,t);if(u==="powerCap")i.problems.push("Power plants nearby are full: build another to let it grow.");else if(u==="water")i.problems.push("Needs water to grow bigger: build a water tower within reach.");else if(u==="waterCap")i.problems.push("Water supply nearby is used up: add another water tower.");else if(u==="desire"){let d=Tl(n,e,t,r),h=el[o+1];r===1?i.problems.push("Wants a nicer area to grow: add parks and services, keep pollution away."):r===2?i.problems.push("Wants more customers and higher land value to grow."):i.problems.push("Wants a road right beside it and fire and police cover to grow."),d<h-.3&&i.rows.push({label:"Appeal",value:"Low",tone:"bad"})}else u===null&&c<=0&&i.problems.push(`Not much demand for ${a.toLowerCase()} right now.`)}}function Ah(n,e,t){let i={x:e,z:t,title:"Grass",rows:[],problems:[]};if(!Number.isInteger(e)||!Number.isInteger(t)||e<0||t<0||e>=n.size||t>=n.size)return i.title="Off the map",i;let s=Jo(n);(!s.computed||n.needsRecompute)&&bi(n);let r=n.tiles,o=t*n.size+e,a=r.kind[o];if(r.terrain[o]===1)return i.title="Water",i.subtitle="Nothing can be built on water. Homes near it are worth more.",i.rows.push({label:"Water pumps",value:"Must touch it"}),i;if(a===3){let l=n.buildings[r.bld[o]];if(l)return HE(n,s,l,i),i}return a===2?(GE(n,s,o,i),i):a===1?(i.title="Road",i.subtitle=`Zones within ${pi} tiles can develop.`,i.rows.push({label:"Upkeep",value:`${ps(zu)} / month`}),i.rows.push(gp(r.pollution[o])),i):(r.trees[o]?(i.title=r.trees[o]>=3?"Woods":r.trees[o]===2?"Copse":"Trees",i.subtitle="Trees clean the air and lift land value nearby.",i.rows.push({label:"Clearing",value:`${ps(zo)} extra to build here`})):r.terrain[o]===2?(i.title="Sandy shore",i.subtitle="Open land by the water, good for building."):(i.title="Grass",i.subtitle="Open land, ready to build on."),i.rows.push(db(r.landValue[o])),i.rows.push({label:"Power reach",value:r.power[o]?"Yes":"No",tone:r.power[o]?"good":"neutral"}),i.rows.push({label:"Water reach",value:r.water[o]?"Yes":"No",tone:r.water[o]?"good":"neutral"}),i.rows.push({label:"Road",value:r.roadDist[o]===0?"Here":r.roadDist[o]<=pi?"Close by":"Too far to zone",tone:r.roadDist[o]<=pi?"good":"neutral"}),r.pollution[o]>=10&&i.rows.push(gp(r.pollution[o])),i)}var bp={zone_res:1,zone_com:2,zone_ind:3},VE={1:"homes",2:"shops",3:"industry"};function Rh(n,e){let t={tool:n,tiles:[],ok:[],cost:0,valid:!1};return e&&(t.reason=e),t}function pb(n,e){let t=i=>On(Number.isFinite(i)?Math.round(i):0,0,n.size-1);return{x:t(e?.x),z:t(e?.z)}}function WE(n,e,t){let i=n.size,s=[],r=t.x-e.x,o=t.z-e.z,a=Math.sign(r),l=Math.sign(o);if(Math.abs(r)>=Math.abs(o)){for(let c=e.x;s.push(e.z*i+c),c!==t.x;c+=a);for(let c=e.z+l;l!==0&&(s.push(c*i+t.x),c!==t.z);c+=l);}else{for(let c=e.z;s.push(c*i+e.x),c!==t.z;c+=l);for(let c=e.x+a;a!==0&&(s.push(t.z*i+c),c!==t.x);c+=a);}return s}function mb(n,e,t){let i=[],s=Math.min(e.x,t.x),r=Math.max(e.x,t.x),o=Math.min(e.z,t.z),a=Math.max(e.z,t.z);for(let l=o;l<=a;l++)for(let c=s;c<=r;c++)i.push(l*n.size+c);return i}function Ch(n,e){return e.valid&&e.cost>n.money&&(e.valid=!1,e.reason="Not enough money"),e}function gb(n,e){let t=n.tiles,i=[],s=0,r=0,o;for(let l of e)t.terrain[l]===1?(i.push(!1),o??="Roads can't cross water yet"):t.kind[l]===3?(i.push(!1),o??="A building is in the way"):t.kind[l]===2&&t.level[l]>0?(i.push(!1),o??="Bulldoze the buildings in the way first"):t.kind[l]===1?i.push(!0):(i.push(!0),s+=j0+(t.trees[l]?zo:0),r++);let a={tool:"road",tiles:e,ok:i,cost:s,valid:!0};return o?(a.valid=!1,a.reason=o):r===0&&(a.valid=!1,a.reason="Already a road"),Ch(n,a)}function xb(n,e,t,i){let s=n.tiles,r=[],o=0,a=0,l=0,c=0,u=0;for(let h of i){let f=s.kind[h];s.terrain[h]===1?(r.push(!1),u++):f===1||f===3?(r.push(!1),c++):f===2?s.level[h]>0?(r.push(!1),c++):s.zone[h]===t?(r.push(!1),l++):(r.push(!0),o+=vf,a++):(r.push(!0),o+=vf+(s.trees[h]?zo:0),a++)}let d={tool:e,tiles:i,ok:r,cost:o,valid:a>0};return a||(l?d.reason=`Already zoned for ${VE[t]}`:c?d.reason="Something is already built here":u?d.reason="Can't zone on water":d.reason="Nothing here can be zoned"),Ch(n,d)}function bb(n,e){let t=n.tiles,i=n.size,s=e.slice(),r=new Set(e),o=new Set;for(let h of e){if(t.kind[h]!==3)continue;let f=n.buildings[t.bld[h]];if(!(!f||o.has(f.id))){o.add(f.id);for(let p=f.z;p<f.z+f.h;p++)for(let x=f.x;x<f.x+f.w;x++){let g=p*i+x;r.has(g)||(r.add(g),s.push(g))}}}let a=[],l=0,c=0,u=new Set;for(let h of s){let f=t.kind[h];if(f===1)a.push(!0),l+=Q0;else if(f===2)a.push(!0),l+=t.level[h]*eg;else if(f===3){a.push(!0);let p=n.buildings[t.bld[h]];p&&!u.has(p.id)&&(u.add(p.id),l+=Math.round(nt[p.type].cost*ng))}else if(t.trees[h])a.push(!0),l+=tg;else{a.push(!1);continue}c++}let d={tool:"bulldoze",tiles:s,ok:a,cost:l,valid:c>0};return c||(d.reason="Nothing to clear here"),Ch(n,d)}function XE(n,e,t,i){let s=n.size,r=n.tiles,o=[[],[],[],[]];for(let d=0;d<i;d++)o[0].push([e+d,t+i]),o[1].push([e+i,t+d]),o[2].push([e+d,t-1]),o[3].push([e-1,t+d]);let a=0,l=0,c=256,u=0;for(let d=0;d<4;d++){let h=0,f=256;for(let[p,x]of o[d]){if(p<0||x<0||p>=s||x>=s)continue;let g=x*s+p;r.kind[g]===1&&h++,f=Math.min(f,r.roadDist[g])}h>l&&(l=h,a=d),f<c&&(c=f,u=d)}return l>0?a:c<255?u:0}function yb(n,e,t,i){let s=nt[t],r=n.tiles,o=n.size,a=s.size,l=Math.floor((a-1)/2),c=i.x-l,u=i.z-l,d=[],h=[],f=s.cost,p;for(let g=u;g<u+a;g++)for(let m=c;m<c+a;m++){if(m<0||g<0||m>=o||g>=o){p??="Too close to the edge of the map";continue}let b=g*o+m;d.push(b);let w=r.kind[b];r.terrain[b]===1?(h.push(!1),p??="Can't build on water"):w===1?(h.push(!1),p??="A road is in the way"):w===3?(h.push(!1),p??="Another building is in the way"):w===2&&r.level[b]>0?(h.push(!1),p??="Bulldoze the buildings here first"):(h.push(!0),r.trees[b]&&(f+=zo))}let x={tool:e,tiles:d,ok:h,cost:f,valid:!0,building:{type:t,x:c,z:u,w:a,h:a,rot:XE(n,c,u,a)}};return vb(n,e)?p?(x.valid=!1,x.reason=p):s.needsWaterEdge&&!$x(n,c,u,a,a)&&(x.valid=!1,x.reason="Must touch a lake or river"):(x.valid=!1,x.reason=`Unlocks at ${Zx(s.unlockPop)} people`),Ch(n,x)}function yp(n,e,t,i){if(e==="inspect")return Rh(e);let s=pb(n,t),r=pb(n,i);if(e==="road")return gb(n,WE(n,s,r));let o=bp[e];if(o!==void 0)return xb(n,e,o,mb(n,s,r));if(e==="bulldoze")return bb(n,mb(n,s,r));let a=pr(e);return a&&nt[a]?yb(n,e,a,r):Rh(e,"Unknown tool")}function xp(n,e){if(!Array.isArray(e))return[];let t=n.size*n.size,i=new Set,s=[];for(let r of e)typeof r!="number"||!Number.isInteger(r)||r<0||r>=t||i.has(r)||(i.add(r),s.push(r));return s}function YE(n,e){let t=e.tool;if(t==="road")return gb(n,xp(n,e.tiles));let i=bp[t];if(i!==void 0)return xb(n,t,i,xp(n,e.tiles));if(t==="bulldoze")return bb(n,xp(n,e.tiles));let s=pr(t);if(s&&nt[s]){let r=e.building;if(!r||!Number.isFinite(r.x)||!Number.isFinite(r.z))return Rh(t,"Pick a spot to build");let o=Math.floor((nt[s].size-1)/2);return yb(n,t,s,{x:r.x+o,z:r.z+o})}return Rh(t,"Unknown tool")}function qE(n,e){return Math.floor(ve(n.seed^2600822924,n.rev.tiles,e)*256)}function vp(n,e){if(!e||typeof e!="object"||e.tool==="inspect")return{ok:!1,spent:0,changed:[]};let t=YE(n,e);if(!t.valid){let d=t.reason??"That can't be done here";return Nn({type:"denied",tool:e.tool,reason:d}),{ok:!1,spent:0,message:d,changed:[]}}let i=n.tiles,s=n.size,r=t.tool,o={tool:r,spent:t.cost,tiles:[],removedBuildings:[],addedBuildingIds:[]},a=[],l=d=>{o.tiles.push({i:d,terrain:i.terrain[d],trees:i.trees[d],kind:i.kind[d],zone:i.zone[d],level:i.level[d],variant:i.variant[d],bld:i.bld[d],distress:i.distress[d]})},c=(d,h,f,p)=>{l(d),i.kind[d]=h,i.zone[d]=f,i.level[d]=0,i.trees[d]=0,i.bld[d]=p,i.distress[d]=0,i.variant[d]=qE(n,d),Nr(n,d),a.push(d)},u=bp[r];if(r==="road")t.tiles.forEach((d,h)=>{t.ok[h]&&i.kind[d]!==1&&c(d,1,0,-1)});else if(u!==void 0)t.tiles.forEach((d,h)=>{t.ok[h]&&c(d,2,u,-1)});else if(r==="bulldoze")t.tiles.forEach((d,h)=>{if(t.ok[h]){if(i.kind[d]===3){let f=n.buildings[i.bld[d]];f&&(o.removedBuildings.push({...f}),n.buildings[f.id]=null)}c(d,0,0,-1)}}),o.removedBuildings.length&&n.rev.buildings++;else if(t.building){let d=t.building,h=n.buildings.length,f={id:h,type:d.type,x:d.x,z:d.z,w:d.w,h:d.h,rot:d.rot,active:!1};n.buildings.push(f),o.addedBuildingIds.push(h);for(let p=d.z;p<d.z+d.h;p++)for(let x=d.x;x<d.x+d.w;x++)c(p*s+x,3,0,h);n.rev.buildings++}return n.money-=t.cost,n.needsRecompute=!0,bi(n),n.undo.push(o),n.undo.length>_f&&n.undo.splice(0,n.undo.length-_f),Nn({type:"applied",tool:r,tiles:a,spent:t.cost}),{ok:!0,spent:t.cost,changed:a}}function _p(n){return n.undo.length>0}function Mp(n){let e=n.undo.pop();if(!e)return!1;let t=n.tiles,i=!1,s=e.addedBuildingIds.slice().sort((r,o)=>o-r);for(let r of s)r===n.buildings.length-1?n.buildings.pop():r>=0&&r<n.buildings.length&&(n.buildings[r]=null),i=!0;for(let r of e.removedBuildings){for(;n.buildings.length<=r.id;)n.buildings.push(null);n.buildings[r.id]={...r},i=!0}for(let r=e.tiles.length-1;r>=0;r--){let o=e.tiles[r];t.terrain[o.i]=o.terrain,t.trees[o.i]=o.trees,t.kind[o.i]=o.kind,t.zone[o.i]=o.zone,t.level[o.i]=o.level,t.variant[o.i]=o.variant,t.bld[o.i]=o.bld,t.distress[o.i]=o.distress,Nr(n,o.i)}return i&&n.rev.buildings++,n.money+=e.spent,n.needsRecompute=!0,bi(n),Nn({type:"undo",tool:e.tool,refund:e.spent}),!0}function vb(n,e){let t=pr(e);if(!t)return!0;let i=nt[t];if(!i)return!1;if(n.stats.population>=i.unlockPop)return!0;let s=Mn[n.milestone];return!!s&&s.population>=i.unlockPop}var wb="cubopolis-save",$E=8,ZE=256,KE=40,jo="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",Sb=new Int16Array(128).fill(-1);for(let n=0;n<jo.length;n++)Sb[jo.charCodeAt(n)]=n;function _b(n){let e=[],t="";for(let i=0;i<n.length;i+=3){let s=n[i],r=i+1<n.length?n[i+1]:0,o=i+2<n.length?n[i+2]:0;t+=jo[s>>2]+jo[(s&3)<<4|r>>4],t+=i+1<n.length?jo[(r&15)<<2|o>>6]:"=",t+=i+2<n.length?jo[o&63]:"=",t.length>=4096&&(e.push(t),t="")}return e.push(t),e.join("")}function Mb(n,e){if(typeof n!="string"||n.length%4!==0)throw new Error(`Save is damaged: ${e} data is not valid.`);let t=0;n.endsWith("==")?t=2:n.endsWith("=")&&(t=1);let i=new Uint8Array(n.length/4*3-t),s=0;for(let r=0;r<n.length;r+=4){let o=[0,0,0,0];for(let l=0;l<4;l++){let c=n.charCodeAt(r+l);if(c===61&&r+l>=n.length-t){o[l]=0;continue}let u=c<128?Sb[c]:-1;if(u<0)throw new Error(`Save is damaged: ${e} data is not valid.`);o[l]=u}let a=o[0]<<18|o[1]<<12|o[2]<<6|o[3];s<i.length&&(i[s++]=a>>16&255),s<i.length&&(i[s++]=a>>8&255),s<i.length&&(i[s++]=a&255)}return i}function JE(n){let e=new Uint8Array(n.length*4),t=new DataView(e.buffer);for(let i=0;i<n.length;i++)t.setInt32(i*4,n[i],!0);return e}function jE(n){let e=new Int32Array(n.length/4),t=new DataView(n.buffer,n.byteOffset,n.byteLength);for(let i=0;i<e.length;i++)e[i]=t.getInt32(i*4,!0);return e}var Tb=["terrain","trees","kind","zone","level","variant","distress"];function Ph(n){let e=n.tiles,t={};for(let s of Tb)t[s]=_b(e[s]);t.bld=_b(JE(e.bld));let i={format:wb,version:1,name:n.name,seed:n.seed,size:n.size,day:n.day,timeOfDay:n.timeOfDay,speed:n.speed,money:n.money,taxes:{res:n.taxes.res,com:n.taxes.com,ind:n.taxes.ind},milestone:n.milestone,monthsInDebt:n.monthsInDebt,happiness:n.stats.happiness,buildings:n.buildings.map(s=>s?{id:s.id,type:s.type,x:s.x,z:s.z,w:s.w,h:s.h,rot:s.rot,active:s.active}:null),history:n.history.map(s=>({...s})),layers:t};return JSON.stringify(i)}function Et(n){throw new Error(n)}function en(n,e,t,i,s=!1){return(typeof n!="number"||!Number.isFinite(n))&&Et(`Save is damaged: ${e} is missing or not a number.`),s&&!Number.isInteger(n)&&Et(`Save is damaged: ${e} must be a whole number.`),(n<t||n>i)&&Et(`Save is damaged: ${e} is out of range.`),n}function Rl(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}function Cl(n){(typeof n!="string"||!n.trim())&&Et("This save is empty.");let e;try{e=JSON.parse(n.trim())}catch{Et("This is not a Cubopolis save (it could not be read).")}Rl(e)||Et("This is not a Cubopolis save."),e.format!==wb&&Et("This is not a Cubopolis save."),en(e.version,"version",1,Number.MAX_SAFE_INTEGER,!0)>1&&Et("This save was made by a newer version of Cubopolis.");let i=en(e.size,"map size",$E,ZE,!0),s=i*i,r=en(e.seed,"map seed",-2147483648,4294967295,!0),o=typeof e.name=="string"?e.name.trim().slice(0,KE):"";o||(o="New City");let a=Hu(i,r,o);a.version=1,a.day=en(e.day,"day",0,1e9,!0),a.timeOfDay=e.timeOfDay===void 0?.35:en(e.timeOfDay,"time of day",0,1);let l=e.speed===void 0?1:en(e.speed,"speed",0,3,!0);a.speed=l,a.money=en(e.money,"money",-1e12,1e12),Rl(e.taxes)||Et("Save is damaged: taxes are missing."),a.taxes={res:en(e.taxes.res,"homes tax",0,20),com:en(e.taxes.com,"shops tax",0,20),ind:en(e.taxes.ind,"industry tax",0,20)},a.milestone=en(e.milestone,"milestone",0,Mn.length-1,!0),a.monthsInDebt=en(e.monthsInDebt,"months in debt",0,1e9,!0),a.stats.happiness=e.happiness===void 0?50:en(e.happiness,"happiness",0,100),Rl(e.layers)||Et("Save is damaged: the map is missing.");let c=e.layers,u=a.tiles;for(let p of Tb){let x=Mb(c[p],p);x.length!==s&&Et(`Save is damaged: the ${p} map has the wrong size.`),u[p].set(x)}let d=Mb(c.bld,"building map");d.length!==s*4&&Et("Save is damaged: the building map has the wrong size."),u.bld.set(jE(d)),Array.isArray(e.buildings)||Et("Save is damaged: the building list is missing."),e.buildings.length>s&&Et("Save is damaged: too many buildings.");let h=[];e.buildings.forEach((p,x)=>{if(p===null){h.push(null);return}Rl(p)||Et(`Save is damaged: building ${x} is not valid.`),p.id!==x&&Et(`Save is damaged: building ${x} has the wrong id.`);let g=p.type;(typeof g!="string"||!Object.prototype.hasOwnProperty.call(nt,g))&&Et(`Save is damaged: building ${x} has an unknown type.`);let m=nt[g].size,b=en(p.x,`building ${x} position`,0,i-m,!0),w=en(p.z,`building ${x} position`,0,i-m,!0);(p.w!==m||p.h!==m)&&Et(`Save is damaged: building ${x} has the wrong size.`);let y=en(p.rot,`building ${x} rotation`,0,3,!0);h.push({id:x,type:g,x:b,z:w,w:m,h:m,rot:y,active:p.active===!0})}),a.buildings=h;for(let p=0;p<s;p++){let x=u.terrain[p],g=u.kind[p];if(x>2&&Et("Save is damaged: unknown terrain."),u.trees[p]>3&&Et("Save is damaged: unknown trees."),g>3&&Et("Save is damaged: unknown tile kind."),u.level[p]>3&&Et("Save is damaged: a lot level is out of range."),x===1&&(g!==0||u.trees[p])&&Et("Save is damaged: something stands on water."),u.trees[p]&&g!==0&&Et("Save is damaged: trees on a built tile."),g===2?(u.zone[p]<1||u.zone[p]>3)&&Et("Save is damaged: a zone has an unknown type."):(u.zone[p]!==0||u.level[p]!==0)&&Et("Save is damaged: zone data on a tile that is not zoned."),g===3){let m=h[u.bld[p]];(u.bld[p]<0||!m)&&Et("Save is damaged: a building tile points at no building.");let b=p%i,w=(p-b)/i;(b<m.x||b>=m.x+m.w||w<m.z||w>=m.z+m.h)&&Et("Save is damaged: a building tile is outside its building.")}else u.bld[p]!==-1&&Et("Save is damaged: a building id on a tile with no building.")}for(let p of h)if(p)for(let x=p.z;x<p.z+p.h;x++)for(let g=p.x;g<p.x+p.w;g++){let m=x*i+g;(u.kind[m]!==3||u.bld[m]!==p.id)&&Et(`Save is damaged: building ${p.id} is missing from the map.`)}Array.isArray(e.history)||Et("Save is damaged: the history is missing.");let f=[];for(let p of e.history.slice(-Qa))Rl(p)||Et("Save is damaged: a history entry is not valid."),f.push({day:en(p.day,"history day",0,1e9,!0),population:en(p.population,"history population",0,1e9),money:en(p.money,"history money",-1e12,1e12),income:en(p.income,"history income",-1e12,1e12),expenses:en(p.expenses,"history expenses",-1e12,1e12),happiness:en(p.happiness,"history happiness",0,100)});return a.history=f,bi(a),Gu(a),a}var QE=3,e3=24,t3=.055;function Ih(n,e="New City"){let t=Hu(64,n,e);return ub(t),bi(t),Gu(t),t}function Eb(n){let e=Jo(n);(n.needsRecompute||!e.computed)&&bi(n),n.day++,ib(n,e);let t=n.stats.happiness;n.stats.happiness=On(t+(e.happinessTarget-t)*t3,0,100),n.stats.demand=qr(e.pop,e.jobsCom,e.jobsInd,n.stats.happiness,n.taxes),(n.needsRecompute||n.day%QE===0||e.changesSinceRecompute>=e3)&&bi(n),sb(n),n.day%Ts===0&&(e.changesSinceRecompute>0&&bi(n),rb(n,e))}function Ab(n,e,t){let i=Number.isFinite(t)?Math.round(t):9;n.taxes[e]=Math.min(20,Math.max(0,i)),bi(n)}var Lh="#ff7a3d",Pl="#3fae5b";function Rb(n,e){let t=1/0,i=-1/0;for(let r of n)r<t&&(t=r),r>i&&(i=r);if(e&&(t=Math.min(t,0),i=Math.max(i,0)),!Number.isFinite(t)||!Number.isFinite(i))return[0,1];if(i-t<1e-6){let r=Math.max(1,Math.abs(i)*.1);return[t-r,i+r]}let s=(i-t)*.08;return[t-s,i+s]}function Cb(n,e,t){let i=n.filter(C=>Number.isFinite(C.money)&&Number.isFinite(C.population));if(i.length<2)return"";let s=4,r=6,o=e-s*2,a=t-r*2,l=i.length,c=C=>s+o*C/(l-1),u=i.map(C=>C.money),d=i.map(C=>C.population),[h,f]=Rb(u,u.some(C=>C<0)),[p,x]=Rb(d,!1),g=Math.min(p,0),m=C=>r+a-(C-h)/(f-h)*a,b=C=>r+a-(C-g)/(x-g||1)*a,w=(C,P)=>C.map((D,N)=>`${N?"L":"M"}${c(N).toFixed(1)} ${P(D).toFixed(1)}`).join(""),y=w(d,b),_=`${y}L${c(l-1).toFixed(1)} ${(r+a).toFixed(1)}L${c(0).toFixed(1)} ${(r+a).toFixed(1)}Z`,M=w(u,m),A="";for(let C=0;C<=3;C++){let P=(r+a*C/3).toFixed(1);A+=`<line x1="${s}" x2="${e-s}" y1="${P}" y2="${P}" class="grid"/>`}let v=h<0?`<line x1="${s}" x2="${e-s}" y1="${m(0).toFixed(1)}" y2="${m(0).toFixed(1)}" class="zero"/>`:"",S=l-1;return`<svg class="chart" viewBox="0 0 ${e} ${t}" width="${e}" height="${t}" aria-hidden="true">`+A+v+`<path d="${_}" fill="${Pl}" fill-opacity=".16"/><path d="${y}" class="ln" stroke="${Pl}"/><path d="${M}" class="ln" stroke="${Lh}"/><circle cx="${c(S).toFixed(1)}" cy="${b(d[S]).toFixed(1)}" r="3.5" fill="${Pl}" class="dot"/><circle cx="${c(S).toFixed(1)}" cy="${m(u[S]).toFixed(1)}" r="3.5" fill="${Lh}" class="dot"/></svg>`}function K(n,e,t){let i=document.createElement(n);return e&&(i.className=e),t!==void 0&&(i.innerHTML=t),i}function ct(n,e,t){let i=K("button",n,e);return i.type="button",t&&i.setAttribute("aria-label",t),i}function Ht(n,e){n.textContent!==e&&(n.textContent=e)}function Yn(n,e){n._html!==e&&(n._html=e,n.innerHTML=e)}function xt(n,e,t){n.classList.contains(e)!==t&&n.classList.toggle(e,t)}function qi(n,e,t){n.style.getPropertyValue(e)!==t&&n.style.setProperty(e,t)}function Tn(n){return n.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function yr(n){for(let e of["keydown","keyup","keypress"])n.addEventListener(e,t=>t.stopPropagation());n.addEventListener("blur",()=>{window.setTimeout(()=>{let e=document.activeElement;(!e||e.tagName!=="INPUT"&&e.tagName!=="TEXTAREA")&&window.scrollTo(0,0)},60)})}function n3(n,e){let t=parseInt(n.slice(1),16),i=1-e,s=Math.round((t>>16&255)*i),r=Math.round((t>>8&255)*i),o=Math.round((t&255)*i);return"#"+(1<<24|s<<16|r<<8|o).toString(16).slice(1)}function i3(n,e){let t=parseInt(n.slice(1),16),i=s=>Math.round(s+(255-s)*e);return"#"+(1<<24|i(t>>16&255)<<16|i(t>>8&255)<<8|i(t&255)).toString(16).slice(1)}function qn(n,e){n.style.setProperty("--c",e),n.style.setProperty("--c-dark",n3(e,.22)),n.style.setProperty("--c-soft",i3(e,.82))}function Pb(n,e){let t=n.getBoundingClientRect(),i=e.getBoundingClientRect();return{x:t.left-i.left,y:t.top-i.top,w:t.width,h:t.height}}var Ib={look:'<circle class="f" cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4l5.1 5.1"/>',road:'<path class="f" d="M9 3.5h6l5.5 17h-17z"/><path d="M12 6.5v2M12 11.5v2.5M12 17.2v2"/>',zones:`<rect x="3.5" y="3.5" width="7.6" height="7.6" rx="2" fill="${Tt.res}"/><rect x="12.9" y="3.5" width="7.6" height="7.6" rx="2" fill="${Tt.com}"/><rect x="3.5" y="12.9" width="17" height="7.6" rx="2" fill="${Tt.ind}"/>`,house:'<path class="f" d="M4 11.2L12 4.5l8 6.7v9.3H4z"/><path d="M10 20.5v-5h4v5"/>',shop:'<path class="f" d="M5 11v9.5h14V11"/><path class="f" d="M3.5 10.5L5.5 4h13l2 6.5c0 1.4-1.2 2.4-2.8 2.4s-2.9-1-2.9-2.4c0 1.4-1.3 2.4-2.8 2.4s-2.8-1-2.8-2.4c0 1.4-1.3 2.4-2.9 2.4s-2.8-1-2.8-2.4z"/><path d="M10 20.5v-4h4v4"/>',factory:'<path class="f" d="M3.5 20.5v-9l5 3v-3l5 3v-3l3 1.8V4h4v16.5z"/><path d="M7 17h1.5M11.5 17H13"/>',bulldoze:'<path class="f" d="M4.5 13.5V7.5h5.2l2.3 6"/><rect class="f" x="3" y="13.5" width="12" height="6.5" rx="3.25"/><path d="M15 15.5h2.5"/><path class="f" d="M17.5 9.5c2.2.6 3.2 2.9 3.2 5.5s-1 4.9-3.2 5.5z"/>',bolt:'<path class="f" d="M13.5 2.5l-9 11h6.5l-1.5 8 9-11H12z"/>',civic:'<path class="f" d="M3 9.5L12 4l9 5.5z"/><path d="M5.5 12.5v5M10 12.5v5M14 12.5v5M18.5 12.5v5M3 20.5h18"/>',tree:'<circle class="f" cx="12" cy="9.5" r="6.5"/><path d="M12 12.5v8.5M8.5 21h7M12 15.5l2.3-2.3"/>',coal:'<path class="f" d="M3.5 20.5V13l4.5-2.8v2.8l4.5-2.8v10.3z"/><path class="f" d="M14.5 20.5V8h4v12.5"/><path d="M3 20.5h18"/><path d="M15 5c.5-1.6 2.6-1.9 3.4-.6.9-1.4 3-1 3.1.7"/>',wind:'<path d="M12 11v10M8.5 21h7"/><path class="f" d="M12 9.3V2.8c1.9.6 2.5 3.3 0 6.5z"/><path class="f" d="M12 9.3V2.8c1.9.6 2.5 3.3 0 6.5z" transform="rotate(120 12 9.3)"/><path class="f" d="M12 9.3V2.8c1.9.6 2.5 3.3 0 6.5z" transform="rotate(240 12 9.3)"/><circle class="n" cx="12" cy="9.3" r="1.5"/>',solar:'<path class="f" d="M6 4h12l2.5 10.5h-17z"/><path d="M4.8 9.2h14.4M10.2 4l-.9 10.5M13.8 4l.9 10.5M12 14.5v6M8 20.5h8"/>',tower:'<path class="f" d="M4.5 5.5L12 2.5l7.5 3v5.5a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 11z"/><path d="M8 8.6c1.3-.8 2.7-.8 4 0s2.7.8 4 0M7.5 13.5L6 21M16.5 13.5L18 21M12 13.5V21M6.8 17.5h10.4"/>',pump:'<path class="f" d="M12 2.8c2.8 3.5 5 6.2 5 8.7a5 5 0 0 1-10 0c0-2.5 2.2-5.2 5-8.7z"/><path d="M2.5 20.2c1.6-1.2 3.1-1.2 4.7 0s3.1 1.2 4.8 0 3.1-1.2 4.7 0 3.1 1.2 4.8 0"/>',drop:'<path class="f" d="M12 3c3.2 4 6 7.2 6 10.4a6 6 0 0 1-12 0C6 10.2 8.8 7 12 3z"/>',bench:'<circle class="f" cx="8.5" cy="8" r="5"/><path d="M8.5 13v7.5M13 15.5h8M14 15.5v5M20 15.5v5M13.5 18.2h7"/>',fountain:'<path class="f" d="M3.5 15.5h17l-1.8 5H5.3z"/><path d="M12 15.5V7M12 7.5c-1.4-2.6-4.4-3.1-6-.6M12 7.5c1.4-2.6 4.4-3.1 6-.6M6.2 10.6v1.2M17.8 10.6v1.2"/>',shield:'<path class="f" d="M12 2.8l7.5 2.8v5.6c0 4.7-3.2 8.3-7.5 9.9-4.3-1.6-7.5-5.2-7.5-9.9V5.6z"/><path class="n" d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>',flame:'<path class="f" d="M12 21.5c-3.9 0-6.5-2.6-6.5-6.2 0-3.5 2.7-5.4 3.5-8.8 1.8 1.2 2.6 3 2.7 4.6 1.6-1.4 2.2-4.2 1.6-7.6 3.6 2.3 6.2 6.5 6.2 11.2 0 3.9-2.5 6.8-7.5 6.8z"/><path d="M12 21.5c-1.7 0-2.8-1.1-2.8-2.7 0-1.8 1.6-2.7 2.3-4.3 1.6 1.2 3.3 2.4 3.3 4.4 0 1.6-1.2 2.6-2.8 2.6z"/>',cross:'<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8v8M8 12h8"/>',hospital:'<path class="f" d="M4.5 20.5V8.5h15v12"/><path d="M9.5 8.5V4h5v4.5M3 20.5h18M9.5 12v5.5M14.5 12v5.5M9.5 14.7h5"/>',school:'<path class="f" d="M4 20.5V11l8-5 8 5v9.5z"/><path d="M12 6V2.5l3.5 1.3L12 5M10 20.5v-4.5h4v4.5M2.5 20.5h19"/>',cap:'<path class="f" d="M1.8 9.5L12 4.5l10.2 5L12 14.5z"/><path d="M6 11.6v4.7c3.5 2.6 8.5 2.6 12 0v-4.7M21.6 10v5.5"/>',stadium:'<path class="f" d="M2.5 10.5v4c0 3 4.3 5.5 9.5 5.5s9.5-2.5 9.5-5.5v-4"/><ellipse class="f" cx="12" cy="10.5" rx="9.5" ry="5"/><ellipse cx="12" cy="10.5" rx="4.5" ry="2"/>',skytower:'<path class="f" d="M9.6 20.5L11 10.2h2l1.4 10.3z"/><path class="f" d="M8.2 7.2h7.6l-1.3 3h-5z"/><path d="M12 7.2V2.5M6 20.5h12"/>',pause:'<rect class="s" x="6.5" y="5.5" width="3.6" height="13" rx="1"/><rect class="s" x="13.9" y="5.5" width="3.6" height="13" rx="1"/>',speed1:'<path class="s" d="M8.5 5.8l9.5 6.2-9.5 6.2z"/>',speed2:'<path class="s" d="M3.8 6.5l7.5 5.5-7.5 5.5zM12.7 6.5l7.5 5.5-7.5 5.5z"/>',speed3:'<path class="s" d="M1.8 7.8l5.8 4.2-5.8 4.2zM9.1 7.8l5.8 4.2-5.8 4.2zM16.4 7.8l5.8 4.2-5.8 4.2z"/>',layers:'<path class="f" d="M12 3.5l9 4.8-9 4.8-9-4.8z"/><path d="M3 12.4l9 4.8 9-4.8M3 16.4l9 4.8 9-4.8"/>',coins:'<ellipse class="f" cx="9.5" cy="6.5" rx="6" ry="2.8"/><path d="M3.5 6.5v4.2c0 1.5 2.7 2.8 6 2.8M3.5 10.7v4.2c0 1.5 2.7 2.8 6 2.8"/><path class="f" d="M10 13v4.6c0 1.5 2.5 2.6 5.5 2.6s5.5-1.1 5.5-2.6V13"/><ellipse class="f" cx="15.5" cy="13" rx="5.5" ry="2.6"/>',menu:'<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',undo:'<path d="M8.5 13.5L4 9l4.5-4.5"/><path d="M4 9h10.5a5 5 0 0 1 0 10H10"/>',close:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',people:'<circle class="f" cx="9" cy="8" r="3.5"/><path class="f" d="M2.5 20c.3-3.6 3-6 6.5-6s6.2 2.4 6.5 6z"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M17.5 14.3c2.3.7 3.7 2.8 4 5.7"/>',faceHappy:'<circle class="f" cx="12" cy="12" r="9"/><circle class="n" cx="9" cy="10" r="1.3"/><circle class="n" cx="15" cy="10" r="1.3"/><path d="M8 14.2c1 1.8 2.4 2.7 4 2.7s3-.9 4-2.7"/>',faceOk:'<circle class="f" cx="12" cy="12" r="9"/><circle class="n" cx="9" cy="10" r="1.3"/><circle class="n" cx="15" cy="10" r="1.3"/><path d="M8.6 15.2h6.8"/>',faceSad:'<circle class="f" cx="12" cy="12" r="9"/><circle class="n" cx="9" cy="10" r="1.3"/><circle class="n" cx="15" cy="10" r="1.3"/><path d="M8 16.6c1-1.5 2.4-2.3 4-2.3s3 .8 4 2.3"/>',lock:'<rect class="f" x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2"/>',star:'<path class="f" d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',warn:'<path class="f" d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.2M12 17.2v.1"/>',info:'<circle class="f" cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',check:'<circle class="f" cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8 5.2-5.6"/>',tick:'<path d="M5.5 12.5l4.2 4.2 8.8-9.2"/>',bulb:'<path class="f" d="M12 2.8a6.5 6.5 0 0 0-3.8 11.8c.8.6 1.3 1.5 1.3 2.4h5c0-.9.5-1.8 1.3-2.4A6.5 6.5 0 0 0 12 2.8z"/><path d="M9.6 20h4.8M10.6 22.5h2.8"/>',copy:'<rect class="f" x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',dice:'<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle class="n" cx="8.4" cy="8.4" r="1.6"/><circle class="n" cx="12" cy="12" r="1.6"/><circle class="n" cx="15.6" cy="15.6" r="1.6"/>',save:'<path class="f" d="M3.5 14.5v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4"/><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/>',restore:'<path class="f" d="M3.5 14.5v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4"/><path d="M12 14.5v-11M7.5 8L12 3.5 16.5 8"/>',plus:'<path d="M12 5v14M5 12h14"/>',sound:'<path class="f" d="M4 9.5h3.5l4.5-4v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.4a7.6 7.6 0 0 1 0 11.2"/>',music:'<path d="M9 18V5.8l11-2.3V16"/><circle class="f" cx="6.5" cy="18" r="2.5"/><circle class="f" cx="17.5" cy="16" r="2.5"/>',haptic:'<rect class="f" x="8" y="3.5" width="8" height="17" rx="2.2"/><path d="M4.8 8.5v7M19.2 8.5v7M2 10.5v3M22 10.5v3"/>',sparkle:'<path class="f" d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',back:'<path d="M14.5 5.5L8 12l6.5 6.5"/>',locate:'<circle class="f" cx="12" cy="12" r="6"/><path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5"/><circle class="n" cx="12" cy="12" r="1.8"/>',cloud:'<path class="f" d="M7 18.5a4 4 0 0 1-.7-7.9 5.8 5.8 0 0 1 11.2-1.4 4.7 4.7 0 0 1 .3 9.3z"/>',gem:'<path class="f" d="M6.5 4.5h11l4 5-9.5 11-9.5-11z"/><path d="M2.5 9.5h19M9.5 4.5L8 9.5l4 11 4-11-1.5-5"/>',map:'<path class="f" d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',chart:'<path d="M3.5 20.5h17"/><path class="f" d="M5.5 20.5v-6h3v6M10.5 20.5v-10h3v10M15.5 20.5v-14h3v14"/>',coin:'<circle class="f" cx="12" cy="12" r="9"/><path d="M14.6 8.8c-.6-.9-1.6-1.4-2.7-1.4-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.6 5.8 4.7 0 1.3-1.3 2.3-3 2.3-1.2 0-2.3-.5-2.9-1.4M12 5.6v1.8M12 16.6v1.8"/>'};function Ze(n,e=""){let t=Ib[n]??Ib.info;return`<svg class="ic${e?" "+e:""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${t}</svg>`}var Lb={power_coal:{icon:"coal",color:"#e8892b"},power_wind:{icon:"wind",color:"#2fb2d6"},power_solar:{icon:"solar",color:"#f0b31c"},water_tower:{icon:"tower",color:"#36a3ff"},water_pump:{icon:"pump",color:"#2b7fd9"},park_small:{icon:"bench",color:"#5cb83a"},park_plaza:{icon:"fountain",color:"#21b0a0"},police:{icon:"shield",color:"#3d7bff"},fire:{icon:"flame",color:"#ff5a36"},clinic:{icon:"cross",color:"#f25c9a"},school:{icon:"school",color:"#9b6bff"},hospital:{icon:"hospital",color:"#e2457a"},college:{icon:"cap",color:"#7a5cf0"},stadium:{icon:"stadium",color:"#ff8a3d"},landmark:{icon:"skytower",color:"#a35fe8"}},Dh={inspect:{icon:"look",color:"#18a999"},road:{icon:"road",color:"#687789"},zone_res:{icon:"house",color:Tt.res},zone_com:{icon:"shop",color:Tt.com},zone_ind:{icon:"factory",color:Tt.ind},bulldoze:{icon:"bulldoze",color:"#ef5a4a"}};function Nh(n){return n.startsWith("build:")?Lb[n.slice(6)]??Dh.inspect:Dh[n]??Dh.inspect}function Il(n){return Lb[n]}var s3={inspect:Dh.inspect,roads:{icon:"road",color:"#687789"},zones:{icon:"zones",color:"#3fae5b"},utilities:{icon:"bolt",color:"#f0a01c"},services:{icon:"civic",color:"#6f63e8"},fun:{icon:"tree",color:"#4caf3c"},bulldoze:{icon:"bulldoze",color:"#ef5a4a"}};function Db(n){return s3[n]??{icon:"info",color:"#687789"}}var kh=[["none",{label:"Off",icon:"map",color:"#687789",hint:"",legend:{}}],["power",{label:"Power",icon:"bolt",color:"#f0b31c",hint:"Which lots have electricity.",legend:{swatches:[["#ffcc2e","Powered"],["#ff4040","No power"]]}}],["water",{label:"Water",icon:"drop",color:"#36a3ff",hint:"Which lots have running water.",legend:{swatches:[["#36a3ff","Has water"],["#ff4040","No water"]]}}],["pollution",{label:"Pollution",icon:"cloud",color:"#8f5b86",hint:"Smoke from factories and coal plants.",legend:{gradient:["#d8b04a","#b06a3a","#5e2a6e"],ends:["A little","Heavy"]}}],["landValue",{label:"Land value",icon:"gem",color:"#2fbf67",hint:"Where people most want to live.",legend:{gradient:["#e5483b","#ffd23f","#33cf6a"],ends:["Low","High"]}}],["police",{label:"Police",icon:"shield",color:"#3d7bff",hint:"Streets covered by police stations.",legend:{gradient:["#3d7bff33","#3d7bff"],ends:["Weak","Strong"]}}],["fire",{label:"Fire",icon:"flame",color:"#ff5a36",hint:"Blocks covered by fire stations.",legend:{gradient:["#ff5a3633","#ff5a36"],ends:["Weak","Strong"]}}],["health",{label:"Health",icon:"cross",color:"#f25c9a",hint:"Homes near clinics and hospitals.",legend:{gradient:["#ff5fa233","#ff5fa2"],ends:["Weak","Strong"]}}],["education",{label:"Education",icon:"cap",color:"#9b6bff",hint:"Homes near schools and colleges.",legend:{gradient:["#9b6bff33","#9b6bff"],ends:["Weak","Strong"]}}]];function kb(n){return(kh.find(([e])=>e===n)??kh[0])[1]}var $i=class{constructor(e,t){this.ctx=e;this.onClose=null;this.shown=!1;this.hideTimer=0;this.modal=t.modal,this.wrap=K("div",`ui-layer ui-layer-${t.layer}`),this.wrap.hidden=!0,this.card=K("div",`ui-sheet ${t.cls}`),this.card.setAttribute("role","dialog"),this.wrap.appendChild(this.card),t.backdropCloses&&this.wrap.addEventListener("click",i=>{i.target===this.wrap&&(e.click(),this.close())}),e.root.appendChild(this.wrap),e.sheets.add(this)}get isOpen(){return this.shown}open(){window.clearTimeout(this.hideTimer),!this.shown&&(this.shown=!0,this.wrap.hidden=!1,this.wrap.offsetWidth,this.wrap.classList.add("is-open"),this.ctx.invalidate())}close(){if(!this.shown)return;this.shown=!1,this.wrap.classList.remove("is-open"),window.clearTimeout(this.hideTimer),this.hideTimer=window.setTimeout(()=>{this.shown||(this.wrap.hidden=!0)},240),this.ctx.invalidate();let e=this.onClose;e&&e()}closeNow(){let e=this.shown;if(this.shown=!1,window.clearTimeout(this.hideTimer),this.wrap.classList.remove("is-open"),this.wrap.hidden=!0,e){this.ctx.invalidate();let t=this.onClose;t&&t()}}};function Uh(n,e,t,i,s){let r=K("div","sh-head"),o=K("span","tile",Ze(t));o.style.setProperty("--c",s);let a=K("h2","sh-title");a.textContent=i;let l=K("div","sh-extra"),c=ct("round sm sh-close",Ze("close"),"Close");return c.addEventListener("click",()=>{n.click(),e.close()}),r.append(o,a,l,c),{el:r,title:a,extra:l}}var Nb="\u2212";function wp(n){let e=String(Math.round(Math.abs(n))),t="";for(let i=0;i<e.length;i++)i>0&&(e.length-i)%3===0&&(t+=","),t+=e[i];return t}function Sp(n){let e=[[1e9,"B"],[1e6,"M"]];for(let[t,i]of e)if(n>=t){let s=n/t;return(s<100?(Math.floor(s*10)/10).toFixed(1).replace(/\.0$/,""):String(Math.floor(s)))+i}return wp(n)}function Pi(n){if(!Number.isFinite(n))return"$0";let e=Math.round(n);return(e<0?Nb:"")+"$"+Sp(Math.abs(e))}function $r(n){let e=Math.round(Number.isFinite(n)?n:0);return e===0?"$0":(e>0?"+":Nb)+"$"+Sp(Math.abs(e))}function vr(n){return Number.isFinite(n)?Sp(Math.max(0,Math.round(n))):"0"}function Ub(n){let e=Math.max(0,Math.floor(n));return`${yf[Tf(e,Ts)]}, Year ${Ef(e,Ts)}`}function Ob(n){let e=Math.max(0,n-1);return`${yf[Tf(e,Ts)]} Y${Ef(e,Ts)}`}function Fb(n){let e=Math.max(0,Math.min(Mn.length-1,n.milestone|0)),t=Mn[e+1];return t?{name:t.name,population:t.population,from:Mn[e].population}:null}function Tp(n,e){return e<=0||n.stats.population>=e?!0:Mn[Math.max(0,Math.min(Mn.length-1,n.milestone|0))].population>=e}function Bb(n){return n>.55?"High":n>.2?"Some":n>-.2?"Low":"None"}var r3=[["res","Homes","house"],["com","Shops","shop"],["ind","Industry","factory"]],o3=232,a3=118;function zb(n){let e=new $i(n,{cls:"budget",modal:!0,backdropCloses:!0,layer:"sheet"}),t=Uh(n,e,"coins","Budget","#f0a01c"),i=K("span","treasury"),s=K("b","num");i.append(K("span","","Treasury"),s),t.extra.appendChild(i);let r=K("div","sh-body budget-body"),o=K("section","b-left"),a=K("section","b-right");r.append(o,a),e.card.append(t.el,r);let l=K("div","b-cols","<span>Tax</span><span>Demand</span><span>Income</span>");o.appendChild(l);let c=r3.map(([P,D,N])=>{let I=K("div","b-zone");I.style.setProperty("--c",Tt[P]);let U=K("span","b-name",`<span class="tile xs">${Ze(N)}</span><span>${D}</span>`),W=K("input","slider");W.type="range",W.min="0",W.max=String(20),W.step="1",W.setAttribute("aria-label",`${D} tax`),yr(W);let O=K("span","b-pct num"),te=K("span","b-demand"),X=K("span","meter"),q=K("i");X.appendChild(q);let $=K("small");te.append(X,$);let he=K("span","b-income num");I.append(U,W,O,te,he),o.appendChild(I);let Q=-1,fe=0,re=()=>{if(fe=0,Q<0)return;let pe=Q;Q=-1,n.actions.setTax(P,pe),C(n.actions.getState())};return W.addEventListener("input",()=>{let pe=Math.round(Number(W.value));Ht(O,`${pe}%`),qi(W,"--p",`${pe/20*100}%`),Q=pe,fe||(fe=requestAnimationFrame(re))}),W.addEventListener("change",()=>{fe&&(cancelAnimationFrame(fe),re()),n.click()}),{zone:P,slider:W,pct:O,fill:q,word:$,inc:he,meter:X}}),u=K("div","b-lines"),d=K("b","num"),h=K("b","num"),f=K("b","num"),p=K("div","b-line",`${Ze("road")}<span>Road upkeep</span>`);p.appendChild(d);let x=K("div","b-line",`${Ze("civic")}<span>Building upkeep</span>`);x.appendChild(h);let g=K("div","b-line b-net","<span>Net per month</span>");g.appendChild(f),u.append(p,x,g),o.appendChild(u),a.appendChild(K("h4","b-sub","Money and people"));let m=K("div","b-chart"),b=K("div","b-legend"),w=K("b","num"),y=K("b","num"),_=K("span","",`<i style="background:${Lh}"></i>Money `);_.appendChild(w);let M=K("span","",`<i style="background:${Pl}"></i>People `);M.appendChild(y),b.append(_,M);let A=K("div","b-axis"),v=K("span");A.append(v,K("span","","Now")),a.append(m,A,b,K("p","b-note",`Taxes above ${9}% slow growth. Lower taxes bring people in but earn less.`));let S="";function C(P){let D=P.stats;Ht(s,Pi(P.money)),xt(s,"bad",P.money<0);for(let O of c){let te=Math.round(P.taxes[O.zone]);document.activeElement!==O.slider&&O.slider.value!==String(te)&&(O.slider.value=String(te));let X=Math.round(Number(O.slider.value));Ht(O.pct,`${X}%`),qi(O.slider,"--p",`${X/20*100}%`);let q=Math.max(-1,Math.min(1,D.demand[O.zone]||0));qi(O.fill,"width",`${Math.round(Math.abs(q)*50)}%`),xt(O.fill,"neg",q<0),Ht(O.word,Bb(q)),Ht(O.inc,$r(D.income[O.zone]))}Ht(d,$r(-D.expenses.roads)),Ht(h,$r(-D.expenses.buildings));let N=D.income.total-D.expenses.total;Ht(f,$r(N)),xt(f,"bad",N<0),xt(f,"good",N>0);let I=P.history,U=I[I.length-1],W=`${I.length}|${U?U.day+":"+U.money:""}`;if(W!==S){S=W;let O=Cb(I,o3,a3);Yn(m,O||`<div class="b-empty">${Ze("chart")}<span>The chart fills in as the months go by.</span></div>`),Ht(v,I.length>=2?Ob(I[0].day):""),A.hidden=I.length<2}Ht(w,Pi(P.money)),Ht(y,vr(D.population))}return{sheet:e,open(){S="",C(n.actions.getState()),e.open()},update(P){e.isOpen&&C(P)}}}function l3(n){switch(n){case"road":return"Drag to lay road";case"zone_res":return"Drag near a road to zone homes";case"zone_com":return"Drag near a road to zone shops";case"zone_ind":return"Drag near a road to zone industry";case"bulldoze":return"Drag over things to clear them";case"inspect":return"Tap anything to see how it is doing";default:return"Drag to place it, lift to build"}}function Hb(n){let e=Fr(n);return!e||e.cost<=0?{amount:"",unit:""}:{amount:Pi(e.cost),unit:e.perTile?"/tile":""}}function Gb(n){let e=pr(n);if(!e)return"";let t=nt[e].size;return`${t}\xD7${t}`}function Vb(n){let e=[{id:"inspect",label:"Look",tools:["inspect"]},...Yg],t=Q=>e.find(fe=>fe.tools.includes(Q))?.id??"inspect",i="inspect",s=null,r=null,o=new Set,a=new Set,l=K("div","dock-wrap"),c=K("div","dock panel"),u=new Map;for(let Q of e){let fe=Db(Q.id),re=ct("dock-btn",`<span class="dock-ic">${Ze(fe.icon)}</span><span class="dock-label">${Tn(Q.label)}</span><i class="dot"></i>`,Q.label);qn(re,fe.color),Q.id==="zones"&&re.classList.add("zones"),re.addEventListener("click",()=>{n.click(),C(Q)}),u.set(Q.id,re),c.appendChild(re)}let d=ct("undo-btn",`${Ze("undo")}<span>Undo</span>`,"Undo");d.hidden=!0,d.addEventListener("click",()=>{n.click(),n.actions.canUndo()&&n.actions.undo(),n.invalidate()});let h=K("div","tray panel");h.hidden=!0;let f=K("div","tray-scroll");h.appendChild(f);let p=[],x=K("div","chip panel");x.hidden=!0;let g=ct("chip-main","","Change tool"),m=K("span","tile sm"),b=K("span","chip-text"),w=K("b"),y=K("span","chip-cost num"),_=K("small"),M=K("span","chip-top");M.append(w,y),b.append(M,_),g.append(m,b);let A=ct("chip-x",Ze("close"),"Put the tool away");x.append(g,A),g.addEventListener("click",()=>{n.click();let Q=e.find(fe=>fe.id===t(i));Q&&Q.tools.length>1&&D(Q)}),A.addEventListener("click",()=>{n.click(),P("inspect")});let v=K("div","pill");v.hidden=!0,v.setAttribute("aria-live","polite");let S=K("div","dock-row");S.append(c,d),l.append(v,x,h,S),n.root.appendChild(l),document.addEventListener("pointerdown",Q=>{if(!s)return;let fe=Q.target;fe&&(h.contains(fe)||c.contains(fe)||x.contains(fe))||N()},!0);function C(Q){if(Q.id==="inspect"){P("inspect");return}if(Q.tools.length===1){P(i===Q.tools[0]?"inspect":Q.tools[0]);return}s===Q.id?N():D(Q)}function P(Q){N(),Q!==i&&(n.actions.setTool(Q),i=n.actions.getTool()),te(),W()}function D(Q){s=Q.id,a=new Set(Q.tools.filter(fe=>o.has(fe)));for(let fe of Q.tools)o.delete(fe);O(),f.innerHTML="",p=Q.tools.map(fe=>{let re=Nh(fe),pe=Fr(fe),k=ct("card","",pe.name);qn(k,re.color);let z=Gb(fe),de=K("span","tile card-ic",`${Ze(re.icon)}${z?`<b class="card-size">${z}</b>`:""}<span class="card-lockic">${Ze("lock")}</span>`),Ee=K("span","card-name");Ee.textContent=pe.name;let ge=K("span","card-cost num"),Ue=K("span","card-lock");return k.append(de,Ee,ge,Ue),a.has(fe)&&k.appendChild(K("span","card-new","New")),k.addEventListener("click",()=>I(fe,k)),f.appendChild(k),{tool:fe,el:k,cost:ge,lock:Ue}}),f.scrollLeft=0,h.hidden=!1,h.offsetWidth,h.classList.add("is-open"),U(n.actions.getState()),te(),W(),n.invalidate()}function N(){s&&(s=null,a.clear(),h.classList.remove("is-open"),h.hidden=!0,te(),W(),n.invalidate())}function I(Q,fe){let re=n.actions.getState();if(!Tp(re,Fr(Q).unlockPop)){n.click(),fe.classList.remove("shake"),fe.offsetWidth,fe.classList.add("shake");return}n.click(),P(Q)}function U(Q){for(let fe of p){let re=Fr(fe.tool),pe=Tp(Q,re.unlockPop);if(xt(fe.el,"locked",!pe),xt(fe.el,"on",fe.tool===i),pe){let{amount:k,unit:z}=Hb(fe.tool);Yn(fe.cost,k?`${k}${z?`<small>${z}</small>`:""}`:"Free"),xt(fe.cost,"bad",re.cost>0&&Q.money<re.cost),Ht(fe.lock,"")}else Yn(fe.cost,""),Ht(fe.lock,`Unlocks at ${vr(re.unlockPop)} people`)}}function W(){let Q=s??t(i);for(let[fe,re]of u)xt(re,"on",fe===Q),xt(re,"open",fe===s)}function O(){for(let Q of e){let fe=u.get(Q.id);fe&&xt(fe,"has-new",Q.tools.some(re=>o.has(re)))}}function te(){let Q=i!=="inspect"&&!s&&!r;if(i!=="inspect"){let fe=Nh(i);qn(x,fe.color),Yn(m,Ze(fe.icon)),Ht(w,Fr(i).name);let{amount:re,unit:pe}=Hb(i),k=Gb(i);Ht(y,[re+pe,k].filter(Boolean).join(" \xB7 ")),Ht(_,l3(i));let z=e.find(de=>de.id===t(i));xt(g,"can-open",!!z&&z.tools.length>1)}x.hidden===Q&&(x.hidden=!Q,Q&&(x.classList.remove("pop"),x.offsetWidth,x.classList.add("pop")))}function X(Q){if(r=Q,!Q){v.hidden||(v.hidden=!0),te();return}let fe=Nh(Q.tool),re=Fr(Q.tool),pe,k=!1;if(Q.valid){let z=0;for(let Ee=0;Ee<Q.ok.length;Ee++)Q.ok[Ee]&&z++;let de=[Tn(re.name)];if(!Q.building){let Ee=Q.tool.startsWith("zone_");de.push(`${vr(z)} ${Ee?z===1?"lot":"lots":z===1?"tile":"tiles"}`)}de.push(Q.cost>0?`<b class="num">${Pi(Q.cost)}</b>`:"<b>Free</b>"),pe=`<span class="tile xs">${Ze(fe.icon)}</span><span>${de.join('<i class="sep"></i>')}</span>`}else{k=!0;let z=Q.reason&&Q.reason.trim()?Q.reason:"Nothing to change here";pe=`${Ze("warn")}<span>${Tn(z)}</span>`}v.dataset.c!==fe.color&&(v.dataset.c=fe.color,qn(v,fe.color)),Yn(v,pe),xt(v,"bad",k),v.hidden&&(v.hidden=!1),te()}function q(Q){let fe=n.actions.getTool();fe!==i&&(i=fe,te(),W()),s&&U(Q);let re=n.actions.canUndo();d.hidden===re&&(d.hidden=!re)}function $(){r=null,v.hidden=!0,o.clear(),O(),N(),i=n.actions.getTool(),te(),W()}function he(Q){for(let fe of Q)o.add(`build:${fe}`);O()}return W(),{update:q,setPreview:X,closeTray:N,isTrayOpen:()=>s!==null,hasTool:()=>i!=="inspect",isPreviewing:()=>r!==null,activeCategory:()=>s??t(i),stackTop:()=>l.getBoundingClientRect().top-n.root.getBoundingClientRect().top,button:Q=>u.get(Q)??null,markNew:he,reset:$}}var Ep=[[0,"pause","Pause"],[1,"speed1","Normal speed"],[2,"speed2","Fast"],[3,"speed3","Fastest"]];function Wb(n,e){let t=K("div","hud panel"),i=ct("hud-cell hud-money","","Money. Opens the budget"),s=K("span","hud-big num"),r=K("span","hud-sub num");i.append(s,r),i.addEventListener("click",()=>{n.click(),e.openBudget()});let o=K("div","hud-cell hud-pop"),a=K("span","hud-line",Ze("people","hud-ic")),l=K("span","hud-big num");a.appendChild(l);let c=K("span","hud-line hud-prog"),u=K("span","bar"),d=K("i");u.appendChild(d);let h=K("span","hud-sub");c.append(u,h),o.append(a,c);let f=K("div","hud-cell hud-when"),p=K("span","hud-mid"),x=K("span","hud-line hud-happy"),g=K("span","face"),m=K("span","hud-mid num");x.append(g,m),f.append(p,x);let b=ct("hud-cell hud-rci","","Demand for homes, shops and industry. Opens the budget"),w=[],y=K("span","rci-bars"),_=K("span","rci-letters");for(let[X,q]of[["res","H"],["com","S"],["ind","I"]]){let $=K("span","rci-bar");$.style.setProperty("--c",Tt[X]);let he=K("i");$.appendChild(he),y.appendChild($),w.push(he);let Q=K("b");Q.textContent=q,Q.style.color=Tt[X],_.appendChild(Q)}b.append(y,_),b.addEventListener("click",()=>{n.click(),e.openBudget()});let M=()=>K("i","hud-div");t.append(i,M(),o,M(),f,M(),b);let A=K("div","hud-right"),v=K("div","speed panel");v.setAttribute("role","radiogroup");let S=Ep.map(([X,q,$])=>{let he=ct("speed-btn",Ze(q),$);return he.setAttribute("role","radio"),he.addEventListener("click",()=>{n.click(),n.actions.setSpeed(X),n.invalidate()}),v.appendChild(he),he}),C=K("div","tools panel"),P=ct("tool-btn",Ze("layers"),"Map layers"),D=ct("tool-btn",Ze("coins"),"Budget"),N=ct("tool-btn",Ze("menu"),"Menu");C.append(P,D,N),P.addEventListener("click",()=>{n.click(),e.toggleLayers()}),D.addEventListener("click",()=>{n.click(),e.openBudget()}),N.addEventListener("click",()=>{n.click(),e.openMenu()}),A.append(v,C),n.root.append(t,A);let I="",U=0,W="";function O(){let X=`${s.textContent}|${r.textContent}|${l.textContent}|${h.textContent}|${p.textContent}`;if(X===W||!A.offsetWidth)return;W=X;let q=()=>A.getBoundingClientRect().left-8;for(let $=0;$<=2&&($!==U&&(t.classList.toggle("fit1",$>=1),t.classList.toggle("fit2",$>=2),U=$),!(t.getBoundingClientRect().right<=q()));$++);}function te(X){let q=X.stats;Ht(s,Pi(X.money));let $=X.history[X.history.length-1],he=$?$.income-$.expenses:q.income.total-q.expenses.total;Ht(r,`${$r(he)}/mo`),xt(r,"bad",he<0),xt(r,"good",he>0),xt(s,"bad",X.money<0),Ht(l,vr(q.population));let Q=Fb(X);if(Q){let k=(q.population-Q.from)/Math.max(1,Q.population-Q.from);qi(d,"width",`${Math.round(Math.max(.04,Math.min(1,k))*100)}%`),Ht(h,Q.name),c.title=`${Q.name} at ${vr(Q.population)} people`,xt(c,"max",!1)}else qi(d,"width","100%"),Ht(h,"Top city!"),xt(c,"max",!0);Ht(p,Ub(X.day));let fe=Math.round(Math.max(0,Math.min(100,q.happiness)));Ht(m,`${fe}%`);let re=fe>=60?"faceHappy":fe>=40?"faceOk":"faceSad";re!==I&&(I=re,Yn(g,Ze(re,"hud-ic")),x.dataset.mood=re);let pe=[q.demand.res,q.demand.com,q.demand.ind];for(let k=0;k<3;k++){let z=Math.max(-1,Math.min(1,pe[k]||0)),de=w[k];qi(de,"height",`${Math.round(Math.abs(z)*50)}%`),xt(de,"neg",z<0)}O();for(let k=0;k<Ep.length;k++){let z=Ep[k][0]===X.speed;xt(S[k],"on",z),S[k].setAttribute("aria-checked",z?"true":"false")}}return{update:te,layersBtn:P,budgetBtn:D,menuBtn:N}}function c3(n,e){if(n&&e.buildingId!==void 0){let s=n.buildings[e.buildingId];if(s)return Il(s.type)}if(!n||e.x<0||e.z<0||e.x>=n.size||e.z>=n.size)return{icon:"look",color:"#18a999"};let t=e.z*n.size+e.x,i=n.tiles;switch(i.kind[t]){case 1:return{icon:"road",color:"#687789"};case 2:return i.zone[t]===1?{icon:"house",color:Tt.res}:i.zone[t]===2?{icon:"shop",color:Tt.com}:{icon:"factory",color:Tt.ind};case 3:{let s=n.buildings[i.bld[t]];if(s)return Il(s.type);break}}return i.terrain[t]===1?{icon:"drop",color:"#36a3ff"}:i.trees[t]?{icon:"tree",color:"#4caf3c"}:{icon:"map",color:"#8fae5a"}}function Xb(n){let e=K("div","inspect panel");e.hidden=!0;let t=K("div","in-head"),i=ct("tile sm in-locate","","Centre the map here"),s=K("div","in-titles"),r=K("h3"),o=K("p");s.append(r,o);let a=ct("round xs",Ze("close"),"Close");t.append(i,s,a);let l=K("div","in-body");e.append(t,l),n.root.appendChild(e);let c=null,u="",d=()=>xt(l,"more",l.scrollHeight-l.scrollTop-l.clientHeight>4);l.addEventListener("scroll",d,{passive:!0}),i.addEventListener("click",()=>{n.click(),c&&n.actions.focusTile(c.x,c.z)}),a.addEventListener("click",()=>{n.click(),h(null),n.actions.inspectClosed?.()});function h(f){if(!f){c=null,u="",e.hidden||(e.classList.remove("is-open"),e.hidden=!0);return}let p=c!==null&&c.x===f.x&&c.z===f.z;c=f;let x=null;try{x=n.actions.getState()}catch{x=null}let g=c3(x,f);qn(e,g.color),Yn(i,Ze(g.icon)),r.textContent=f.title||"Here",o.textContent=f.subtitle??"",o.hidden=!f.subtitle;let m="";if(f.problems.length){m+='<ul class="in-problems">';for(let w of f.problems){let y=w.indexOf(":"),_=y>0&&y<40?`<b>${Tn(w.slice(0,y))}</b>${Tn(w.slice(y))}`:Tn(w);m+=`<li>${Ze("warn")}<span>${_}</span></li>`}m+="</ul>"}if(f.rows.length){m+='<dl class="in-grid">';for(let w of f.rows){let y=w.value.length>14||w.label.length>16?" wide":"";m+=`<div class="in-cell tone-${w.tone??"neutral"}${y}"><dt>${Tn(w.label)}</dt><dd>${Tn(w.value)}</dd></div>`}m+="</dl>"}!f.problems.length&&!f.rows.length&&(m='<p class="in-empty">Nothing to report here.</p>');let b=m+"|"+f.title;if(b!==u){u=b;let w=p?l.scrollTop:0;l.innerHTML=m,l.scrollTop=w}e.hidden?(e.hidden=!1,e.offsetWidth,e.classList.add("is-open"),d()):p||(e.classList.remove("bump"),e.offsetWidth,e.classList.add("bump")),d()}return{show:h,isOpen:()=>c!==null}}function Yb(n,e){let t=K("div","layers-pop panel");t.hidden=!0,t.appendChild(K("h4","pop-title","Map layers"));let i=K("div","layers-grid");t.appendChild(i);let s=new Map;for(let[b,w]of kh){let y=ct("layer-opt",`<span class="tile xs">${Ze(w.icon)}</span><span>${Tn(w.label)}</span>`,w.label);qn(y,w.color),y.addEventListener("click",()=>{n.click(),f(b),x()}),s.set(b,y),i.appendChild(y)}let r=K("div","legend panel");r.hidden=!0;let o=K("div","leg-head"),a=K("span","tile xs"),l=K("b"),c=ct("round xs",Ze("close"),"Hide layer");o.append(a,l,c);let u=K("p","leg-hint"),d=K("div","leg-body");r.append(o,u,d),c.addEventListener("click",()=>{n.click(),f("none")}),n.root.append(t,r);let h=null;document.addEventListener("pointerdown",b=>{if(t.hidden)return;let w=b.target;w&&(t.contains(w)||e.contains(w))||x()},!0);function f(b){n.actions.setOverlay(b),m()}function p(){m(),t.hidden=!1,t.offsetWidth,t.classList.add("is-open"),xt(e,"open",!0)}function x(){t.hidden||(t.classList.remove("is-open"),t.hidden=!0,xt(e,"open",!1))}function g(b){let w=kb(b);qn(r,w.color),Yn(a,Ze(w.icon)),l.textContent=w.label,u.textContent=w.hint;let y="",_=w.legend;_.swatches?y=_.swatches.map(([M,A])=>`<span class="sw"><i style="background:${M}"></i>${Tn(A)}</span>`).join(""):_.gradient&&_.ends&&(y=`<span class="ramp" style="background:linear-gradient(90deg,${_.gradient.join(",")})"></span><span class="ends"><span>${Tn(_.ends[0])}</span><span>${Tn(_.ends[1])}</span></span>`),d.innerHTML=y}function m(){let b=n.actions.getOverlay();if(b!==h){h=b;for(let[w,y]of s)xt(y,"on",w===b);xt(e,"on",b!=="none"),b==="none"?(r.classList.remove("is-open"),r.hidden=!0):(g(b),r.hidden&&(r.hidden=!1,r.offsetWidth,r.classList.add("is-open")))}}return{toggle:()=>t.hidden?p():x(),close:x,isOpen:()=>!t.hidden,update:m}}var qb=[Tt.res,Tt.com,Tt.ind,"#ff7a3d","#ff5a7a","#9b6bff","#18a999"],u3=34;function $b(n){let e=new $i(n,{cls:"celebrate",modal:!0,backdropCloses:!0,layer:"celebrate"}),t=K("div","confetti");e.wrap.insertBefore(t,e.card);let i=[],s=K("div","cel-badge",`<span class="rays"></span><span class="star">${Ze("star")}</span>`),r=K("h2","cel-title"),o=K("p","cel-line"),a=K("div","cel-reward"),l=K("h4","cel-sub","Now you can build"),c=K("div","cel-unlocks"),u=ct("pbtn big primary","<span>Keep building!</span>");e.card.append(s,r,o,a,l,c,u),u.addEventListener("click",()=>{n.click(),e.close()}),e.onClose=()=>{i.length?window.setTimeout(h,280):window.setTimeout(()=>t.innerHTML="",260)};function d(){let f="";for(let p=0;p<u3;p++){let x=qb[p%qb.length],g=Math.random()*100,m=7+Math.random()*7,b=Math.random()*.5,w=1.6+Math.random()*1.3,y=(Math.random()-.5)*120,_=(Math.random()<.5?-1:1)*(240+Math.random()*480);f+=`<i style="left:${g.toFixed(1)}%;width:${m.toFixed(1)}px;height:${m.toFixed(1)}px;background:${x};animation-delay:${b.toFixed(2)}s;animation-duration:${w.toFixed(2)}s;--dx:${y.toFixed(0)}px;--spin:${_.toFixed(0)}deg"></i>`}t.innerHTML=f}function h(){let f=i.shift();if(!f)return;r.textContent=`${f.name}!`;let p=Mn[f.index];o.textContent=p?`Your city reached ${wp(p.population)} people.`:"Your city keeps growing.",a.innerHTML=f.reward>0?`${Ze("coin")}<span>Reward <b class="num">+${Pi(f.reward)}</b></span>`:"",a.hidden=f.reward<=0,c.innerHTML="";for(let x of f.unlocked){let g=nt[x];if(!g)continue;let m=Il(x),b=K("div","cel-item",`<span class="tile">${Ze(m.icon)}</span><span>${Tn(g.name)}</span>`);qn(b,m.color),c.appendChild(b)}l.hidden=c.childElementCount===0,c.hidden=c.childElementCount===0,d(),e.open()}return{sheet:e,show(f){i.push(f),e.isOpen||h()},clear(){i.length=0,t.innerHTML="",e.closeNow()}}}function h3(){try{return"0.1.0 (build 44)"}catch{return"dev"}}function Zb(n,e){let t=new $i(n,{cls:"settings",modal:!0,backdropCloses:!0,layer:"sheet"}),i=Uh(n,t,"menu","Menu","#687789"),s=K("div","sh-body settings-body"),r=K("section","set-left"),o=K("section","set-right");s.append(r,o);let a=K("div","set-foot");a.textContent=`Cubopolis ${h3()} \xB7 made of little blocks`,t.card.append(i.el,s,a);let l=()=>n.actions.getSettings(),c=re=>{n.actions.setSettings({...l(),...re})},u=(re,pe,k)=>{let z=K("div","set-row",`${Ze(re,"set-ic")}<span class="set-label">${pe}</span>`);return z.appendChild(k),r.appendChild(z),z},d=K("div","seg"),h=["low","medium","high"].map(re=>{let pe=ct("seg-btn",re==="low"?"Low":re==="medium"?"Medium":"High");return pe.addEventListener("click",()=>{n.click(),c({quality:re}),w()}),d.appendChild(pe),[re,pe]});u("sparkle","Graphics",d);let f=(re,pe)=>{let k=K("input","slider");return k.type="range",k.min="0",k.max="100",k.step="1",k.setAttribute("aria-label",pe),yr(k),k.addEventListener("input",()=>{let z=Math.round(Number(k.value));qi(k,"--p",`${z}%`),c({[re]:z/100})}),k.addEventListener("change",()=>n.click()),k},p=f("sfxVolume","Sound volume"),x=f("musicVolume","Music volume");u("sound","Sound",p),u("music","Music",x);let g=(re,pe)=>{let k=ct("switch","<i></i>",re);return k.setAttribute("role","switch"),k.addEventListener("click",()=>{let z=!l()[pe];c(pe==="tips"&&z?{tips:!0,seenTips:[]}:{[pe]:z}),n.click(),w()}),k},m=g("Vibration","haptics"),b=g("Tips","tips");u("haptic","Vibration",m),u("bulb","Tips",b);function w(){let re=l();for(let[pe,k]of h)xt(k,"on",re.quality===pe);for(let[pe,k]of[[p,re.sfxVolume],[x,re.musicVolume]]){let z=Math.round(Math.max(0,Math.min(1,Number(k)||0))*100);pe.value=String(z),qi(pe,"--p",`${z}%`)}for(let[pe,k]of[[m,re.haptics],[b,re.tips]])xt(pe,"on",!!k),pe.setAttribute("aria-checked",k?"true":"false")}let y=new Map,_=re=>{let pe=K("div",`set-view set-${re}`);return pe.hidden=re!=="list",y.set(re,pe),o.appendChild(pe),pe},M=re=>{for(let[pe,k]of y)k.hidden=pe!==re},A=(re,pe)=>{let k=K("div","set-subhead"),z=ct("round xs",Ze("back"),"Back");z.addEventListener("click",()=>{n.click(),M("list")});let de=K("b");de.textContent=pe,k.append(z,de),re.appendChild(k)},v=_("list");v.appendChild(K("h4","set-title","Your city"));let S=(re,pe,k,z,de="")=>{let Ee=ct(`set-action ${de}`,`<span class="tile xs">${Ze(re)}</span><span class="sa-text"><b>${pe}</b><small>${k}</small></span>`);return Ee.addEventListener("click",()=>{n.click(),z()}),v.appendChild(Ee),Ee},C=S("save","Save now","Your city also saves by itself",async()=>{C.disabled=!0;try{await n.actions.saveNow(),n.toast("City saved","good")}catch{n.toast("Could not save right now. Try again in a moment.","bad")}finally{C.disabled=!1}});S("copy","Back up city","Get a code you can keep safe",()=>{let re="";try{re=n.actions.exportSave()}catch{re=""}D.value=re,U.textContent=re?"":"Could not make a backup code right now.",U.className=re?"set-status":"set-status bad",M("backup")}),S("restore","Restore city","Load a city from a backup code",()=>{O.value="",q.textContent="",q.className="set-status",M("restore")}),S("plus","New city","Start fresh on a new map",()=>M("confirm"),"danger");let P=_("backup");A(P,"Back up city"),P.appendChild(K("p","set-p","Copy this code and keep it somewhere safe, like your Notes."));let D=K("textarea","code");D.readOnly=!0,D.rows=3,D.spellcheck=!1,yr(D),D.addEventListener("focus",()=>D.select());let N=K("div","set-btnrow"),I=ct("pbtn primary",`${Ze("copy")}<span>Copy code</span>`),U=K("span","set-status");N.append(I,U),P.append(D,N),I.addEventListener("click",async()=>{n.click();let re=D.value;if(!re)return;let pe=!1;try{navigator.clipboard&&window.isSecureContext!==!1&&(await navigator.clipboard.writeText(re),pe=!0)}catch{pe=!1}if(!pe){D.focus(),D.select(),D.setSelectionRange(0,re.length);try{pe=document.execCommand("copy")}catch{pe=!1}}U.textContent=pe?"Copied!":"Selected: tap and hold to copy",U.className=pe?"set-status good":"set-status"});let W=_("restore");A(W,"Restore city"),W.appendChild(K("p","set-p","Paste a backup code. It replaces the city you have now."));let O=K("textarea","code");O.rows=3,O.spellcheck=!1,O.placeholder="Paste your code here",O.setAttribute("autocapitalize","off"),O.setAttribute("autocomplete","off"),yr(O);let te=K("div","set-btnrow"),X=ct("pbtn primary",`${Ze("restore")}<span>Load city</span>`),q=K("span","set-status");te.append(X,q),W.append(O,te),X.addEventListener("click",async()=>{n.click();let re=O.value.trim();if(!re){q.textContent="Paste a code first.",q.className="set-status bad";return}X.disabled=!0,q.textContent="Loading\u2026",q.className="set-status";let pe=!1;try{pe=await n.actions.importSave(re)}catch{pe=!1}X.disabled=!1,pe?(t.close(),n.toast("City restored","good")):(q.textContent="That code did not work. Check it was copied completely.",q.className="set-status bad")});let $=_("confirm");A($,"Start a new city?"),$.appendChild(K("p","set-p","Your current city will be replaced. Back it up first if you might want it again."));let he=K("div","set-btnrow"),Q=ct("pbtn","<span>Keep playing</span>"),fe=ct("pbtn danger",`${Ze("plus")}<span>New city</span>`);return he.append(Q,fe),$.appendChild(he),Q.addEventListener("click",()=>{n.click(),M("list")}),fe.addEventListener("click",()=>{n.click(),t.closeNow(),e.newCity()}),{sheet:t,open(){w(),M("list"),t.open()}}}var Kb=[124,201,92],d3=[104,182,78],Jb=[240,220,150],Ap=[52,140,220],Qo=[96,186,240],f3=[52,138,66],p3=[82,168,84],m3=[110,118,130];function Rp(n){let e=parseInt(n.slice(1),16);return[e>>16&255,e>>8&255,e&255]}function jb(n){let e=n.tiles,t=n.size*n.size,i=0,s=0,r=0;for(let c=0;c<t;c++)e.terrain[c]===1?i++:e.terrain[c]===2&&r++,e.trees[c]&&s++;let o=i/t,a=s/t,l=o>.28?"Lake country":o>.1?"Lakeside":a>.3?"Woodland":a>.15?"Leafy meadows":"Open plains";return{water:o,trees:a,sand:r/t,kind:l}}function Qb(n,e){let t=n.getContext("2d");if(!t)return;let i=e.size,s=n.width,r=n.height,o=e.tiles,a=t.createImageData(s,r),l=a.data,c=new Uint8Array(i*i).fill(3);for(let p=0;p<i;p++)for(let x=0;x<i;x++){let g=p*i+x;if(o.terrain[g]!==1)continue;let m=3;for(let b=-2;b<=2&&m>0;b++)for(let w=-2;w<=2;w++){let y=x+w,_=p+b;y<0||_<0||y>=i||_>=i||o.terrain[_*i+y]!==1&&(m=Math.min(m,Math.max(Math.abs(w),Math.abs(b))-1))}c[g]=m}let u=Rp(Tt.res),d=Rp(Tt.com),h=Rp(Tt.ind),f=s/i;for(let p=0;p<r;p++){let x=Math.min(i-1,Math.floor(p/f)),g=p/f-x;for(let m=0;m<s;m++){let b=Math.min(i-1,Math.floor(m/f)),w=m/f-b,y=x*i+b,_,M=o.terrain[y];if(M===1){let S=c[y]/3;_=[Qo[0]+(Ap[0]-Qo[0])*S,Qo[1]+(Ap[1]-Qo[1])*S,Qo[2]+(Ap[2]-Qo[2])*S]}else if(o.kind[y]===1)_=m3;else if(o.kind[y]===2)_=o.zone[y]===1?u:o.zone[y]===2?d:h;else if(o.kind[y]===3)_=[236,232,222];else if(o.trees[y]){let S=w-.5,C=g-.5;_=S*S+C*C<.2?S+C<-.15?p3:f3:M===2?Jb:Kb}else M===2?_=Jb:_=ve(b,x,3)<.18?d3:Kb;let A=.94+ve(b,x,7)*.1,v=(p*s+m)*4;l[v]=Math.min(255,_[0]*A),l[v+1]=Math.min(255,_[1]*A),l[v+2]=Math.min(255,_[2]*A),l[v+3]=255}}t.putImageData(a,0,0)}var g3=["Pebble","Maple","Clover","Cobble","Sunny","Honey","Puddle","Tumble","Brick","Marble","Juniper","Willow","Copper","Bramble","Thistle","Button","Lantern","Biscuit","Pickle","Toffee","Hazel","Meadow","Saffron","Cinder","Bluebell","Acorn","Nutmeg","Pumpkin","Sparrow","Otter","Kettle","Wobble","Dapple","Fable","Gumdrop","Mossy","Peachy","Ripple","Bumble","Cozy"],e1=["ton","ville","brook","by","field","haven","port","stead","burgh","wick","mouth","dale","ford","bury"],x3=["Bay","Springs","Hollow","Heights","Falls","Crossing","Harbor","Valley","Grove","Cove","Hills","Landing","Park","Point"],t1=["New","Port","Little","Upper","Old","East","West","North","South","Fort"];function ea(n,e){return n[Math.floor(e()*n.length)%n.length]}function Ll(n=Math.random){let e=n(),t=ea(g3,n);if(e<.4){let s=ea(e1,n);return t[t.length-1]===s[0]&&(s=s==="ton"?"ville":"ton"),(/e$/.test(t)&&/^[aeiouy]/.test(s)?t.slice(0,-1):t)+s}if(e<.72)return`${t} ${ea(x3,n)}`;if(e<.9)return`${ea(t1,n)} ${t}`;let i=ea(e1,n);return t[t.length-1]===i[0]&&(i="ton"),`${ea(t1,n)} ${t}${i}`}var n1="CUBO",b3="POLIS",Oh=["#ff7a3d","#f2b632","#4cc764","#3d8bff","#9b6bff","#ff5a7a","#18a999","#f2b632","#ff7a3d"],i1=24;function y3(){try{return"0.1.0 (build 44)"}catch{return"dev"}}function v3(){let n=K("div","logo");n.setAttribute("role","img"),n.setAttribute("aria-label","Cubopolis");let e=0,t=[n1,b3],i=[n1.length,0];return t.forEach((s,r)=>{let o=K("div",`logo-row r${r}`);for(let a=0;a<s.length;a++){let l=K("span","lb");l.textContent=s[a],qn(l,Oh[e%Oh.length]);let c=[-3,2,-1.5,3,-2.5,1.5,-2,2.5,-1][e%9];l.style.setProperty("--tilt",`${c}deg`),l.style.animationDelay=`${.08+(i[r]+a)*.07}s`,o.appendChild(l),e++}n.appendChild(o)}),n}function s1(n){let e=new $i(n,{cls:"title",modal:!0,backdropCloses:!1,layer:"screen"});e.wrap.classList.add("title-wrap");let t=K("div","floaters");for(let O=0;O<9;O++){let te=K("i");qn(te,Oh[O*3%Oh.length]),te.style.left=`${6+O*37%88}%`,te.style.top=`${10+O*53%76}%`,te.style.animationDelay=`${-O*1.7}s`,te.style.setProperty("--s",`${10+O*7%14}px`),t.appendChild(te)}e.wrap.insertBefore(t,e.card);let i=K("div","logo-box"),s=K("p","tagline","Build a little city, block by block."),r=K("div","title-btns"),o=ct("pbtn big primary",`${Ze("speed1")}<span>Continue</span>`);o.hidden=!0;let a=ct("pbtn big",`${Ze("plus")}<span>New City</span>`);r.append(o,a);let l=K("div","title-ver",y3());e.card.append(i,s,r),e.wrap.appendChild(l);let c=!1;o.addEventListener("click",async()=>{if(c)return;n.click(),c=!0,o.disabled=!0;let O=!1;try{O=await n.actions.continueCity()}catch{O=!1}c=!1,o.disabled=!1,O?e.close():(o.hidden=!0,a.classList.add("primary"),n.toast("Your saved city could not be opened. Start a new one?","bad"))}),a.addEventListener("click",()=>{n.click(),U(!0)});function u(){d.closeNow(),i.innerHTML="",i.appendChild(v3()),o.hidden=!0,a.classList.add("primary"),e.open(),n.actions.hasSave().then(O=>{e.isOpen&&(o.hidden=!O,a.classList.toggle("primary",!O))}).catch(()=>{})}let d=new $i(n,{cls:"newcity",modal:!0,backdropCloses:!1,layer:"screen"});d.wrap.classList.add("title-wrap");let h=K("div","nc-head"),f=ct("round sm",Ze("back"),"Back"),p=K("h2","sh-title","A new city");h.append(f,p);let x=K("div","nc-map"),g=K("div","nc-frame"),m=K("canvas");g.appendChild(m);let b=ct("pbtn",`${Ze("dice")}<span>Another map</span>`);x.append(g,b);let w=K("div","nc-side"),y=K("label","nc-label","Name your city"),_=K("div","nc-name"),M=K("input");M.type="text",M.maxLength=i1,M.autocomplete="off",M.spellcheck=!1,M.setAttribute("autocapitalize","words"),M.setAttribute("enterkeyhint","done"),M.id="cubo-city-name",y.htmlFor=M.id,yr(M);let A=ct("round",Ze("dice"),"Another name");_.append(M,A);let v=K("div","nc-facts"),S=ct("pbtn big primary",`<span>Start building</span>${Ze("speed1")}`),C=K("p","nc-hint",`You start with <b>${Pi(25e3)}</b>. Lay roads, zone homes beside them, then bring in power and water so they grow.`);w.append(y,_,v,C,S);let P=K("div","nc-body");P.append(x,w),d.card.append(h,P);let D=os(),N=!0;function I(){g.classList.add("loading"),requestAnimationFrame(()=>requestAnimationFrame(()=>{try{let O=n.actions.previewMap(D),te=Math.min(3,Math.max(1,window.devicePixelRatio||1)),X=g.clientWidth||200,q=Math.round(X*te),$=Math.max(1,Math.floor(q/O.size));m.width=m.height=$*O.size,Qb(m,O);let he=jb(O);v.innerHTML=`<span class="fact">${Ze("map")}<b>${he.kind}</b></span><span class="fact">${Ze("drop")}${Math.round(he.water*100)}% water</span><span class="fact">${Ze("tree")}${Math.round(he.trees*100)}% trees</span>`}catch(O){console.error("map preview failed",O),v.textContent=""}g.classList.remove("loading")}))}function U(O){N=O,D=os(),M.value=Ll(),e.closeNow(),d.open(),I()}function W(){M.blur(),N?(d.closeNow(),u()):d.close()}return f.addEventListener("click",()=>{n.click(),W()}),b.addEventListener("click",()=>{n.click(),D=os(),I()}),A.addEventListener("click",()=>{n.click();let O=Ll();for(let te=0;te<4&&O===M.value;te++)O=Ll();M.value=O}),M.addEventListener("keydown",O=>{O.key==="Enter"&&M.blur()}),S.addEventListener("click",()=>{n.click(),M.blur();let O=M.value.replace(/\s+/g," ").trim().slice(0,i1)||Ll();d.close(),n.actions.startNewCity(D,O)}),{showTitle:u,showNewCity:U,title:e,newCity:d,closeAll(){e.closeNow(),d.closeNow()},newCityBack(){d.isOpen&&W()}}}var _3=[{id:"roads",target:"roads",text:"Tap <b>Roads</b>, then drag on the map to lay your first street.",when:n=>n.roads===0},{id:"zones",target:"zones",text:"Now tap <b>Zones</b>, pick <b>Homes</b> and drag beside your road. Houses grow there.",when:n=>n.roads>0&&n.zones===0},{id:"power",target:"utilities",text:"Homes need power. Put a <b>Coal Power Plant</b> from <b>Utilities</b> near your zones.",when:n=>n.zones>0&&n.powerPlants===0},{id:"water",target:"utilities",text:"The lights are on! A <b>Water Tower</b> from <b>Utilities</b> lets buildings grow bigger.",when:n=>n.poweredHomes>0&&n.waterBuildings===0},{id:"shops",target:"zones",text:"People want somewhere to shop. Zone some <b>Shops</b> (blue) near the homes.",when:(n,e)=>e.stats.population>=30&&e.stats.demand.com>.25&&n.comZones===0},{id:"industry",target:"zones",text:"Residents need jobs. Zone some <b>Industry</b> (yellow), a little away from homes.",when:(n,e)=>e.stats.population>=60&&e.stats.demand.ind>.25&&n.indZones===0},{id:"look",target:"inspect",text:"Tap <b>Look</b>, then tap any building to see what it needs to grow.",when:n=>n.poweredHomes>=6,shownFor:12},{id:"jobs",target:"zones",text:"Lots of people are out of work. Zone more <b>Shops</b> or <b>Industry</b>.",when:(n,e)=>e.stats.population>=200&&e.stats.unemployment>.2,shownFor:12},{id:"services",target:"services",text:"<b>Police</b> and <b>Fire Stations</b> are open. Services near homes make people happier.",when:(n,e)=>e.milestone>=1&&n.safety===0},{id:"money",target:"budget",text:"Money is running low. Open the <b>Budget</b> to check taxes and upkeep.",when:(n,e)=>e.money<2e3&&e.stats.income.total-e.stats.expenses.total<0,shownFor:12}],r1=1.4;function M3(n){let e=n.tiles,t=n.size*n.size,i={roads:0,zones:0,resZones:0,comZones:0,indZones:0,poweredHomes:0,powerPlants:0,waterBuildings:0,safety:0};for(let s=0;s<t;s++){let r=e.kind[s];if(r===1)i.roads++;else if(r===2){i.zones++;let o=e.zone[s];o===1?(i.resZones++,e.level[s]>=1&&e.power[s]&&i.poweredHomes++):o===2?i.comZones++:o===3&&i.indZones++}}for(let s of n.buildings){if(!s)continue;let r=nt[s.type];r&&(r.power&&i.powerPlants++,r.water&&i.waterBuildings++,(s.type==="police"||s.type==="fire")&&i.safety++)}return i}function o1(n,e){let t=K("div","tip panel");t.hidden=!0,t.setAttribute("role","status");let i=K("span","tile xs",Ze("bulb")),s=K("p"),r=ct("pbtn sm","Got it"),o=K("i","tip-arrow");t.append(i,s,r,o),n.root.appendChild(t);let a=null,l="",c=0,u=null,d=0,h=null,f=0,p=null,x=new Set,g=-1,m=new Set;r.addEventListener("click",()=>{n.click(),h&&b(h.id),y()});function b(S){if(!x.has(S)){x.add(S);try{let C=n.actions.getSettings();C.seenTips.includes(S)||n.actions.setSettings({...C,seenTips:[...C.seenTips,S]})}catch{}}}function w(S,C){return x.has(S)||C.includes(S)}function y(){h=null,f=0,p&&p.classList.remove("tip-target"),p=null,t.hidden||(t.classList.remove("is-open"),t.hidden=!0)}function _(S){return S.target==="budget"?e.budgetButton:e.dockButton(S.target)}function M(S){let C=_(S);if(!C)return;let P=n.root,D=Pb(C,P),{left:N,right:I}=e.bounds(),U=t.offsetWidth||300,W=D.x+D.w/2,O=Math.max(N,Math.min(I-U,W-U/2));t.style.left=`${Math.round(O)}px`,t.style.setProperty("--ax",`${Math.round(W-O)}px`);let te=S.target==="budget";xt(t,"below",te),te?(t.style.top=`${Math.round(D.y+D.h+12)}px`,t.style.bottom=""):(t.style.top="",t.style.bottom=`${Math.round(P.clientHeight-Math.min(D.y,e.dockTop())+12)}px`),p!==C&&(p&&p.classList.remove("tip-target"),p=C,C.classList.add("tip-target"))}function A(S){h=S,f=0,m.add(S.id),Yn(s,S.text),t.hidden=!1,M(S),t.offsetWidth,t.classList.add("is-open")}function v(S,C){let P;try{P=n.actions.getSettings()}catch{return}if(!P.tips){h&&y(),u=null;return}let D=P.seenTips.length;D<g&&x.clear(),g=D,c-=C;let N=`${S.rev.tiles}|${S.rev.buildings}|${S.rev.derived}`;if((!a||N!==l&&c<=0)&&(a=M3(S),l=N,c=.5),h)if(!h.when(a,S))b(h.id),y();else if(e.blocked(h.target)){u=h,d=r1,y();return}else{f+=C,h.shownFor&&f>=h.shownFor?(b(h.id),y()):M(h);return}let I=null;for(let U of _3)w(U.id,P.seenTips)||(U.when(a,S)?I||(I=U):m.has(U.id)&&b(U.id));I!==u?(u=I,d=0):u&&(d+=C),u&&d>=r1&&!e.blocked(u.target)&&A(u)}return{update:v,reset(){y(),a=null,l="",u=null,d=0}}}var w3=3,S3=3500,T3=25;function a1(n){let e=K("div","toasts");e.setAttribute("aria-live","polite"),n.appendChild(e);let t=[];function i(a,l=!0){let c=t.indexOf(a);if(!(c<0)){if(t.splice(c,1),window.clearTimeout(a.timer),!l){a.el.remove();return}a.el.classList.add("out"),window.setTimeout(()=>a.el.remove(),220)}}function s(a){return S3+Math.max(0,a.length-40)*T3}function r(a,l="info"){let c=String(a??"").trim();if(!c)return;let u=t.find(x=>x.text===c);if(u){window.clearTimeout(u.timer),u.timer=window.setTimeout(()=>i(u),s(c)),u.el.classList.remove("nudge"),u.el.offsetWidth,u.el.classList.add("nudge");return}for(;t.length>=w3;)i(t[0],!1);let d=l==="good"?"check":l==="bad"?"warn":"info",h=K("div",`toast tone-${l}`,Ze(d)),f=K("span");f.textContent=c,h.appendChild(f);let p={el:h,text:c,timer:0};h.addEventListener("click",()=>i(p)),e.appendChild(h),t.push(p),p.timer=window.setTimeout(()=>i(p),s(c))}function o(){for(let a of[...t])i(a,!1)}return{push:r,clear:o}}var E3=1/8,A3=600;function l1(n,e){n.classList.add("cubo-ui"),document.addEventListener("touchstart",()=>{},{passive:!0});let t=new Set,i=!0,s=!1,r=a1(n),o={root:n,actions:e,sheets:t,click(){try{e.click()}catch{}},toast:(S,C)=>r.push(S,C),invalidate(){i=!0,s||(s=!0,Promise.resolve().then(()=>{s=!1,M()}))}},a=Wb(o,{openBudget:()=>_(()=>f.open()),toggleLayers:()=>{l.closeTray(),h.toggle()},openMenu:()=>_(()=>g.open())}),l=Vb(o),c=Xb(o),u=-1,d=-1,h=Yb(o,a.layersBtn),f=zb(o),p=$b(o),x=s1(o),g=Zb(o,{newCity:()=>x.showNewCity(!1)}),m=n.querySelector(".hud"),b=n.querySelector(".hud-right"),w=o1(o,{dockButton:S=>l.button(S),budgetButton:a.budgetBtn,bounds:()=>{let S=n.getBoundingClientRect(),C=m.getBoundingClientRect(),P=b.getBoundingClientRect();return{left:C.left-S.left,right:P.right-S.left}},dockTop:()=>l.stackTop(),blocked:S=>y()||l.isTrayOpen()||l.isPreviewing()||c.isOpen()||h.isOpen()||l.hasTool()&&l.activeCategory()===S});function y(){for(let S of t)if(S.modal&&S.isOpen)return!0;return!1}function _(S){l.closeTray(),h.close();for(let C of t)C.isOpen&&C!==p.sheet&&C.closeNow();S()}function M(){let S=x.title.isOpen||x.newCity.isOpen;xt(n,"screen-open",S),xt(n,"modal-open",y())}let A={name:"",at:-1e9};pn("toast",S=>{performance.now()-A.at<A3&&A.name&&S.text.includes(A.name)||r.push(S.text,S.tone)}),pn("milestone",S=>{A={name:S.name,at:performance.now()},l.markNew(S.unlocked??[]),l.closeTray(),h.close(),p.show({index:S.index,name:S.name,reward:S.reward,unlocked:S.unlocked??[]}),o.invalidate()}),pn("reset",()=>{l.reset(),c.show(null),h.close(),w.reset(),r.clear(),p.clear(),f.sheet.closeNow(),g.sheet.closeNow(),o.invalidate()});for(let S of["applied","undo","month"])pn(S,()=>o.invalidate());let v=0;return{update(S,C){if(!S)return;let P=Number.isFinite(C)&&C>0?Math.min(C,1):0;if(v+=P,!i&&v<E3)return;let D=v;v=0,i=!1,M(),a.update(S),l.update(S),h.update(),f.update(S),w.update(S,D)},setPreview(S){l.setPreview(S)},showInspect(S){c.show(S),u=S?S.x:-1,d=S?S.z:-1,S&&h.close(),o.invalidate()},isInspectOpen:()=>c.isOpen(),refreshInspect(S){!S||!c.isOpen()||S.x!==u||S.z!==d||c.show(S)},back(){if(p.sheet.isOpen)return p.sheet.close(),!0;if(x.newCity.isOpen)return x.newCityBack(),!0;for(let S of t)if(S.isOpen&&S!==x.title&&S!==p.sheet)return S.close(),!0;return x.title.isOpen?!1:h.isOpen()?(h.close(),!0):l.isTrayOpen()?(l.closeTray(),!0):c.isOpen()?(c.show(null),e.inspectClosed?.(),o.invalidate(),!0):!1},showTitle(){l.closeTray(),h.close(),c.show(null),l.setPreview(null);for(let S of t)S.isOpen&&S.closeNow();x.showTitle(),M()},isModalOpen:y}}var Bh="city",c1=.1,R3=8,C3=.5,x1=.25,P3=8e3,I3=2e4,L3=.045,b1=new URLSearchParams(location.search),D3=b1.get("debug")==="1";function k3(n){if(!n)return;let e=n.split(",").map(i=>Number(i)),t=["--safe-left","--safe-right","--safe-bottom"];for(let i=0;i<t.length;i++){let s=e[i];Number.isFinite(s)&&s>=0&&s<=400&&document.documentElement.style.setProperty(t[i],`${s}px`)}}k3(b1.get("safe"));var yi=null,Cp=null,Fh=0,u1=new Set;function zh(n){if(n instanceof Error)return n.message||n.name||"Unknown error";if(typeof n=="string")return n;try{return JSON.stringify(n)??String(n)}catch{return String(n)}}function y1(n,e){if(document.body){if(!yi){yi=document.createElement("div"),yi.className="boot-banner",yi.setAttribute("role","alert");let t='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 22 20H2z" fill="#fff" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 3.5 22 20H2z" fill="#e2453a" stroke="#e2453a" stroke-width="1" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.4" fill="#fff"/></svg>';yi.innerHTML=`<div class="bb-icon">${t}</div><div class="bb-text"><b class="bb-title"></b><span class="bb-sub"></span><code class="bb-detail"></code></div><div class="bb-btns"><button type="button" class="bb-btn bb-reload">Reload</button><button type="button" class="bb-btn bb-close">Keep playing</button></div>`,yi.querySelector(".bb-reload").addEventListener("click",()=>{_r("reload"),location.reload()}),yi.querySelector(".bb-close").addEventListener("click",()=>{yi?.remove(),yi=null,Fh=0}),document.body.appendChild(yi),Cp=yi.querySelector(".bb-detail")}Fh++,yi.querySelector(".bb-title").textContent=n,yi.querySelector(".bb-sub").textContent=$n?"Your city saves by itself, so reloading is safe. If it keeps happening, take a screenshot of this.":"Reloading usually fixes it. If it keeps happening, take a screenshot of this.",Cp&&(Cp.textContent=Fh>1?`${e} (+${Fh-1} more)`:e)}}function oa(n,e=""){let t=zh(n).slice(0,300),i=e+"|"+t;u1.has(i)||(u1.add(i),console.error("Cubopolis error"+(e?` (${e})`:"")+":",n)),y1("Oops, something went wrong",t)}window.addEventListener("error",n=>{!n.error&&!n.message||oa(n.error??n.message,"uncaught")});window.addEventListener("unhandledrejection",n=>oa(n.reason,"promise"));var na=Gg(),Ot=Ih(os(),"Cubopolis"),$n=!1,ia="inspect",Np="none",ms=null,Up=document.visibilityState==="hidden",h1=typeof window.matchMedia=="function"?window.matchMedia("(orientation: portrait) and (max-width: 600px)"):null,ra=!1,v1=0,Bp=0,zp=!1,d1=-1/0,Zt,En,ai,Zi;function _r(n){if(!$n)return Promise.resolve(!1);let e;try{e=Ph(Ot)}catch(t){return oa(t,"save"),Promise.resolve(!1)}return v1=performance.now(),ra=!1,zp=!1,Hg(Bh,e).then(()=>!0,t=>{ra=!0;let i=performance.now();if(n!=="manual"&&i-d1>6e4&&(d1=i,Nn({type:"toast",text:"Could not save your city. Free some space on the phone, then try Menu \u2192 Save now.",tone:"bad"})),n==="manual")throw t;return!1})}function Pp(n){Ot=n,$n=!0,ta=0,ia="inspect",ms=null,Np="none",En.cancel(),En.setTool("inspect"),En.setMapSize(n.size),En.rig.reset(!0),Zt.setState(n),Zt.setOverlay("none"),Zt.setPreview(null),Zt.setSelection(null),ai.setPreview(null),ai.showInspect(null),ra=!1,Nn({type:"reset"})}function _1(){ms=null,Zt.setSelection(null),ai.showInspect(null)}var f1={getState:()=>Ot,setTool(n){n!==ia&&(ia=n,En.setTool(n),Zt.setPreview(null),ai.setPreview(null),n!=="inspect"&&(Zi.play("tool"),ms&&_1()))},getTool:()=>ia,setSpeed(n){Ot.speed=n},setOverlay(n){Np=n,Zt.setOverlay(n)},getOverlay:()=>Np,setTax(n,e){Ab(Ot,n,e)},undo(){Mp(Ot)&&(Bp=performance.now(),ra=!0)},canUndo:()=>$n&&_p(Ot),previewMap:n=>Ih(n),startNewCity(n,e){Pp(Ih(n,e)),_r("new")},async continueCity(){let n=await Ju(Bh);if(!n)return!1;let e;try{e=Cl(n)}catch(t){return console.warn("Cubopolis: the saved city could not be loaded:",zh(t)),!1}return Pp(e),!0},async hasSave(){return await Ju(Bh)!==null},async saveNow(){await _r("manual")},exportSave:()=>Ph(Ot),async importSave(n){let e;try{e=Cl(n)}catch(t){return Nn({type:"toast",text:zh(t),tone:"bad"}),!1}return Pp(e),await _r("import"),!0},getSettings:()=>na,setSettings(n){let e=na;na=n,Vg(n),Zi.setVolumes(n.sfxVolume,n.musicVolume),n.quality!==e.quality&&(Zt.setQuality(n.quality),Zr())},focusTile(n,e){En.rig.focus(n,e)},click(){Zi.play("click"),Or("selection")},inspectClosed(){ms=null,Zt.setSelection(null)}},Ip=-1,N3={plan:(n,e,t)=>yp(Ot,n,e,t),apply(n){vp(Ot,n),n.valid&&(Bp=performance.now(),ra=!0)},preview(n){Zt.setPreview(n),ai.setPreview(n);let e=n?n.tiles.length:-1;n&&Ip>=0&&e!==Ip&&Or("selection"),Ip=e},inspect(n){if(!n||!$n){_1();return}ms={x:n.x,z:n.z},Zt.setSelection(ms),ai.showInspect(Ah(Ot,n.x,n.z))},pick:(n,e)=>Zt.pickTile(n,e),touched:()=>Zi.unlock()},Us,Op=0,Fp=0,M1=0;function Zr(){if(!Zt)return;let n=Us.clientWidth||window.innerWidth,e=Us.clientHeight||window.innerHeight,t=window.devicePixelRatio||1;Op=n,Fp=e,M1=t,Zt.resize(n,e,t)}var kl=performance.now(),ta=0,Lp=0,Dp=x1,p1=!1,m1=!1,g1=0,sa=null,kp=0,Dl=0;function U3(n){let e=ai.isModalOpen();e!==p1&&(p1=e,En.setEnabled(!e),e&&En.cancel());let t=$n&&Ot.speed>0&&!e&&!(h1&&h1.matches);if(t){let i=K0[Ot.speed];ta+=n;let s=0;for(;ta>=i&&s<R3;)Eb(Ot),ta-=i,s++;ta>i&&(ta=i),Ot.timeOfDay=(Ot.timeOfDay+n*Ot.speed/J0)%1}if($n||(En.rig.yaw=En.rig.yaw+n*L3),En.update(n),En.rig.apply(Zt.camera),Zt.update(n,Ot),ms&&(ai.isInspectOpen()?(Lp+=n,Lp>=C3&&(Lp=0,ai.refreshInspect(Ah(Ot,ms.x,ms.z)))):(ms=null,Zt.setSelection(null))),ai.update(Ot,n),Dp+=n,Dp>=x1&&(Dp=0,Zi.setAmbience({population:Ot.stats.population,night:Vu(Ot.timeOfDay),paused:!t})),Zt.render(),m1||(m1=!0,console.log("CUBOPOLIS_BOOT_OK"),setTimeout(()=>{try{Ux()}catch(i){oa(i,"models")}},300)),$n){let i=performance.now();(zp||ra&&i-Bp>I3)&&i-v1>P3&&_r("auto")}sa&&O3()}function O3(){kp++;let n=performance.now();if(Dl||(Dl=n),n-Dl<500||!sa)return;let e=kp*1e3/(n-Dl);kp=0,Dl=n;let t=Zt.stats();sa.textContent=`${e.toFixed(0)} fps \xB7 ${t.drawCalls} draws \xB7 ${(t.triangles/1e3).toFixed(0)}k tris \xB7 day ${Ot.day}`}function w1(n){if(requestAnimationFrame(w1),Up){kl=n;return}let e=(n-kl)/1e3;kl=n,e>0||(e=0),e>c1&&(e=c1);try{U3(e),g1=0}catch(t){oa(t,"frame"),++g1>30&&$n&&(Ot.speed=0)}}function F3(){Us=document.getElementById("world");let n=document.getElementById("ui");if(!Us||!n)throw new Error("The page is missing its game elements.");Zi=Z0(),Zi.setVolumes(na.sfxVolume,na.musicVolume);try{Zt=Xx(Us,Ot,na.quality)}catch(i){console.error("Cubopolis: 3D graphics failed to start:",i),y1("Cubopolis could not start its 3D graphics","This device or browser has WebGL switched off or unavailable. "+zh(i));return}Zr(),typeof ResizeObserver=="function"&&new ResizeObserver(()=>{let i=window.devicePixelRatio||1;(Us.clientWidth!==Op||Us.clientHeight!==Fp||i!==M1)&&Zr()}).observe(Us),window.addEventListener("resize",Zr),window.addEventListener("orientationchange",()=>{Zr(),setTimeout(Zr,250)}),En=Zu(Us,N3,Ot.size),En.rig.reset(!0),ai=l1(n,f1),xf(Zi),Wg(),pn("month",()=>{$n&&(zp=!0)});let e=()=>Zi.unlock();window.addEventListener("touchend",e,{capture:!0,passive:!0}),window.addEventListener("pointerup",e,{capture:!0,passive:!0}),window.addEventListener("keydown",e,{capture:!0}),window.addEventListener("keydown",i=>{if(i.key!=="Escape"&&i.key!=="Esc")return;let s=i.target;if(s&&(s.tagName==="INPUT"||s.tagName==="TEXTAREA")){s.blur();return}ai.back()||$n&&!ai.isModalOpen()&&ia!=="inspect"&&f1.setTool("inspect")}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"?(Up=!0,_r("hidden"),Zi.suspend()):(Up=!1,kl=performance.now(),Zi.resume(),Zr())}),window.addEventListener("pagehide",()=>{_r("pagehide")}),window.addEventListener("cubopolis-update",()=>{if(!$n){location.reload();return}_r("update"),Nn({type:"toast",text:"A new version of Cubopolis is ready. Close the game and open it again to get it.",tone:"good"})}),D3&&(sa=document.createElement("div"),sa.className="boot-debug",document.body.appendChild(sa));let t=new Z;window.cubopolis={get state(){return Ot},get playing(){return $n},get tool(){return ia},tileToScreen(i,s){return t.set(i+.5,0,s+.5).project(Zt.camera),{x:(t.x+1)/2*Op,y:(1-t.y)/2*Fp,inFront:t.z<1}},view(){let i=En.rig.current;return{tx:i.tx,tz:i.tz,yaw:i.yaw,pitch:i.pitch,distance:i.distance}},stats:()=>Zt.stats()},ai.showTitle(),Ju(Bh).then(i=>{if(!(!i||$n))try{let s=Cl(i);if($n)return;Ot=s,Zt.setState(s),En.setMapSize(s.size),En.rig.reset(!0)}catch{}}).catch(()=>{}),kl=performance.now(),requestAnimationFrame(w1)}try{F3()}catch(n){oa(n,"boot")}})();
