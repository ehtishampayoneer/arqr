/* The rug on a real floor, in 3D: shared by the preview's product pages and start page.

   The room is Poly Haven's "Lebombo" (CC0), a living room photographed in 360° from 1.38 m up
   (measured from its 2.05 m door). model-viewer projects that photo onto the floor at the
   same height, so the floor is at true scale next to the rug's true size. make_demo.py turns
   each rug (yaw) so it lies square to the walls, clear of them and of the patch of sunlight
   (room_fit.py). The camera starts where a person would stand: eyes 1.6 m up, a step or two
   from the rug, with the window and its sunlight behind the rug.

     ARQRRoom.mount(box, { glb, yaw, L, W, poster, name })   -> the <model-viewer>
     ARQRRoom.view(mv, 'whole' | 'corner' | 'close' | 'low')  -> moves the camera there    */
(function () {
  var ROOM = '/demo/persian-rug-gallery/img/room.jpg';
  var CAMERA_HEIGHT = '1.38m';
  var EYES = 1.6;                       // metres: where a standing person looks from
  var FOV = 42;                         // degrees, top to bottom
  // the two sides of this room that look best, both with the window behind the rug
  // (model-viewer camera theta, the room's own directions, whatever the rug's yaw)
  var FACES = [160, -110];
  var loading = null;

  function load() {
    if (!loading) {
      loading = new Promise(function (done) {
        var s = document.createElement('script');
        s.type = 'module';
        s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
        s.onload = done; s.onerror = done;
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  function isWide(box) { var r = box.getBoundingClientRect(); return !r.height || r.width / r.height >= 1.15; }

  // the room side to look from: at the rug's long side in a wide frame, down its length in a tall one
  function face(o, wide) {
    var best = null;
    FACES.forEach(function (th) {
      var rel = Math.abs(Math.sin((th - o.yaw) * Math.PI / 180));    // 1 = side on, 0 = along its length
      var score = wide ? rel : 1 - rel;
      if (!best || score > best.score) best = { th: th, score: score };
    });
    return best.th;
  }

  // a wide frame looks a little up, to show the room; a tall one a little down, so the
  // buttons along its foot don't cover the near fringe
  function wholeTarget(mv) { return '0m ' + (mv.wide ? '0.2' : '-0.25') + 'm 0m'; }

  function wholeOrbit(mv) {
    var r = mv.rug, half = Math.hypot((r.L + 0.16) / 2, r.W / 2);     // with the fringe
    var R = Math.max(2.8, 0.95 * half / Math.sin(FOV / 2 * Math.PI / 180));
    var phi = Math.acos(Math.min(1, EYES / R)) * 180 / Math.PI;
    return mv.face + 'deg ' + phi.toFixed(1) + 'deg ' + R.toFixed(2) + 'm';
  }

  function mount(box, o) {
    load();
    var mv = document.createElement('model-viewer');
    mv.rug = o;
    mv.wide = isWide(box);
    mv.face = face(o, mv.wide);
    mv.setAttribute('src', o.glb);
    mv.setAttribute('alt', o.name + ' in 3D on a living-room floor, at its real size');
    if (o.poster) mv.setAttribute('poster', o.poster);
    mv.setAttribute('skybox-image', ROOM);
    mv.setAttribute('skybox-height', CAMERA_HEIGHT);
    mv.setAttribute('orientation', '0deg 0deg ' + o.yaw + 'deg');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('touch-action', 'pan-y');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('shadow-softness', '1');
    mv.setAttribute('exposure', '1');
    mv.setAttribute('field-of-view', FOV + 'deg');
    mv.setAttribute('min-camera-orbit', 'auto 0deg 0.45m');
    mv.setAttribute('max-camera-orbit', 'auto 82deg 6m');
    mv.setAttribute('camera-orbit', wholeOrbit(mv));
    mv.setAttribute('camera-target', wholeTarget(mv));
    box.insertBefore(mv, box.firstChild);          // under the box's own labels and buttons
    return mv;
  }

  // a point on the rug (its own across / along, in metres) where it lies in the room
  function onFloor(mv, across, along) {
    var t = mv.rug.yaw * Math.PI / 180;
    return { x: across * Math.cos(t) + along * Math.sin(t), z: -across * Math.sin(t) + along * Math.cos(t) };
  }

  function view(mv, name) {
    var r = mv.rug, target = 'auto auto auto', orbit;
    if (name === 'corner') {
      // the corner on the camera's side, seen from just outside it
      var best = null;
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) {
        var p = onFloor(mv, s[0] * r.W / 2, s[1] * r.L / 2);
        var th = Math.atan2(p.x, p.z) * 180 / Math.PI;
        var off = Math.abs(((th - mv.face + 540) % 360) - 180);
        if (!best || off < best.off) best = { p: p, th: th, off: off };
      });
      target = best.p.x.toFixed(3) + 'm 0m ' + best.p.z.toFixed(3) + 'm';
      orbit = best.th.toFixed(1) + 'deg 60deg 1.4m';
    } else if (name === 'close') {
      var c = onFloor(mv, 0, r.L * 0.12);
      target = c.x.toFixed(3) + 'm 0m ' + c.z.toFixed(3) + 'm';
      orbit = mv.face + 'deg 45deg 0.7m';
    } else if (name === 'low') {
      target = '0m 0.02m 0m';
      orbit = mv.face + 'deg 79deg ' + (Math.max(r.L, r.W) * 1.1).toFixed(2) + 'm';
    } else {
      target = wholeTarget(mv);
      orbit = wholeOrbit(mv);
    }
    mv.cameraTarget = target;
    mv.cameraOrbit = orbit;
  }

  window.ARQRRoom = { load: load, mount: mount, view: view };
})();
