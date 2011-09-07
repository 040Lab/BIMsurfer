/*
 * BIM Viewer
 * Copyright 2011, Bimserver.org.
 */
"use strict";

(function() {
  var constants, controlsToggleLayer, modifySubAttr, mouseDown, mouseMove, mouseUp, mouseWheel, orbitLookAt, orbitLookAtNode, recordToVec3, recordToVec4, registerDOMEvents, sceneInit, state, vec3ToRecord, vec4ToRecord, zoomLookAt, zoomLookAtNode;
  modifySubAttr = function(node, attr, subAttr, value) {
    var attrRecord;
    attrRecord = node.get(attr);
    attrRecord[subAttr] = value;
    return node.set(attr, attrRecord);
  };
  recordToVec3 = function(record) {
    return [record.x, record.y, record.z];
  };
  recordToVec4 = function(record) {
    return [record.x, record.y, record.z, record.w];
  };
  vec3ToRecord = function(vec) {
    return {
      x: vec[0],
      y: vec[1],
      z: vec[2]
    };
  };
  vec4ToRecord = function(vec) {
    return {
      x: vec[0],
      y: vec[1],
      z: vec[2],
      w: vec[3]
    };
  };
  orbitLookAt = function(dAngles, orbitUp, lookAt) {
    var axis, dAngle, eye0, eye0len, eye0norm, eye1, look, result, rotMat, tangent0, tangent0norm, tangent1, tangentError, up0, up0norm, up1;
    if (dAngles[0] === 0.0 && dAngles[1] === 0.0) {
      return {
        eye: lookAt.eye,
        up: lookAt.up
      };
    }
    eye0 = recordToVec3(lookAt.eye);
    up0 = recordToVec3(lookAt.up);
    look = recordToVec3(lookAt.look);
    eye0len = SceneJS_math_lenVec3(eye0);
    eye0norm = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3Scalar(eye0, 1.0 / eye0len, eye0norm);
    tangent0 = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(up0, eye0, tangent0);
    tangent0norm = SceneJS_math_normalizeVec3(tangent0);
    up0norm = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(eye0norm, tangent0norm, up0norm);
    axis = [tangent0norm[0] * -dAngles[1] + up0norm[0] * -dAngles[0], tangent0norm[1] * -dAngles[1] + up0norm[1] * -dAngles[0], tangent0norm[2] * -dAngles[1] + up0norm[2] * -dAngles[0]];
    dAngle = SceneJS_math_lenVec2(dAngles);
    rotMat = SceneJS_math_rotationMat4v(dAngle, axis);
    eye1 = SceneJS_math_transformVector3(rotMat, eye0);
    tangent1 = SceneJS_math_transformVector3(rotMat, tangent0);
    tangentError = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3(tangent1, orbitUp, tangentError);
    SceneJS_math_subVec3(tangent1, tangentError);
    up1 = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(eye1, tangent1, up1);
    return result = {
      eye: vec3ToRecord(eye1),
      look: lookAt.look,
      up: vec3ToRecord(up1)
    };
  };
  orbitLookAtNode = function(node, dAngles, orbitUp) {
    return node.set(orbitLookAt(dAngles, orbitUp, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };
  zoomLookAt = function(distance, limits, lookAt) {
    var eye0, eye0len, eye1, eye1len, look, result;
    eye0 = recordToVec3(lookAt.eye);
    look = recordToVec3(lookAt.look);
    eye0len = SceneJS_math_lenVec3(eye0);
    eye1len = Math.clamp(eye0len + distance, limits[0], limits[1]);
    eye1 = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3Scalar(eye0, eye1len / eye0len, eye1);
    return result = {
      eye: vec3ToRecord(eye1),
      look: lookAt.look,
      up: lookAt.up
    };
  };
  zoomLookAtNode = function(node, distance, limits) {
    return node.set(zoomLookAt(distance, limits, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };
  constants = {
    camera: {
      maxOrbitSpeed: Math.PI * 0.1,
      orbitSpeedFactor: 0.01,
      zoomSpeedFactor: 0.05
    }
  };
  Math.clamp = function(s, min, max) {
    return Math.min(Math.max(s, min), max);
  };
  state = {
    scene: SceneJS.scene('Scene'),
    canvas: document.getElementById('scenejsCanvas'),
    viewport: {
      domElement: document.getElementById('viewport'),
      selectedElement: null,
      mouse: {
        last: [0, 0],
        leftDragging: false,
        middleDragging: false
      }
    },
    camera: {
      distanceLimits: [0.0, 0.0]
    }
  };
  sceneInit = function() {
    var sceneData, sceneDiameter;
    modifySubAttr(state.scene.findNode('main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height);
    sceneData = state.scene.data();
    sceneDiameter = SceneJS_math_lenVec3(sceneData.bounds);
    return state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0];
  };
  sceneInit();
  state.scene.start();
  mouseDown = function(event) {
    state.viewport.mouse.last = [event.clientX, event.clientY];
    switch (event.which) {
      case 1:
        return state.viewport.mouse.leftDragging = true;
      case 2:
        return state.viewport.mouse.middleDragging = true;
    }
  };
  mouseUp = function(event) {
    state.viewport.mouse.leftDragging = false;
    return state.viewport.mouse.middleDragging = false;
  };
  mouseMove = function(event) {
    var delta, deltaLength, orbitAngles;
    if (state.viewport.mouse.middleDragging) {
      delta = [event.clientX - state.viewport.mouse.last[0], event.clientY - state.viewport.mouse.last[1]];
      deltaLength = SceneJS_math_lenVec2(delta);
      orbitAngles = [0.0, 0.0];
      SceneJS_math_mulVec2Scalar(delta, constants.camera.orbitSpeedFactor / deltaLength, orbitAngles);
      orbitAngles = [Math.clamp(orbitAngles[0], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed), Math.clamp(orbitAngles[1], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed)];
      orbitLookAtNode(state.scene.findNode('main-lookAt'), orbitAngles, [0.0, 0.0, 1.0]);
    }
    return state.viewport.mouse.last = [event.clientX, event.clientY];
  };
  mouseWheel = function(event) {
    var zoomDistance;
    zoomDistance = event.wheelDelta / -120.0 * state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor;
    return zoomLookAtNode(state.scene.findNode('main-lookAt'), zoomDistance, state.camera.distanceLimits);
  };
  controlsToggleLayer = function(event) {
    return state.scene.set('tagMask', '(' + (event.target.id.split(/^layer\-/))[1] + ')');
  };
  registerDOMEvents = function() {
    state.viewport.domElement.addEventListener('mousedown', mouseDown, true);
    state.viewport.domElement.addEventListener('mouseup', mouseUp, true);
    state.viewport.domElement.addEventListener('mousemove', mouseMove, true);
    state.viewport.domElement.addEventListener('mousewheel', mouseWheel, true);
    return state.viewport.domElement.addEventListener('DOMMouseScroll', mouseWheel, true);
  };
  registerDOMEvents();
  ($('#layer-walls')).change(controlsToggleLayer);
  ($('#layer-doors')).change(controlsToggleLayer);
  ($('#layer-windows')).change(controlsToggleLayer);
  ($('#layer-columns')).change(controlsToggleLayer);
  ($('#layer-roofs')).change(controlsToggleLayer);
  ($('#layer-floors')).change(controlsToggleLayer);
}).call(this);
