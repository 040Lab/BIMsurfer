# Orbit camera model for manipulating the SceneJS lookat node
orbitLookAt = (dAngles, lookAt) ->
  # TODO: Include the 'look' target in the calculation
  # NOTE: This would probably be more elegant with quaternions, but the scenejs camera is already in a matrix-like format

  eye0 = recordToVec3 lookAt.eye
  up0 = recordToVec3 lookAt.up
  look = recordToVec3 lookAt.look

  # Create an axis-angle rotation transformation
  eyeLen = SceneJS_math_lenVec3 eye0
  eye0norm = [0.0,0.0,0.0]
  SceneJS_math_mulVec3Scalar eye0, 1.0 / eyeLen, eye0norm

  tangent0 = [0.0,0.0,0.0]
  SceneJS_math_cross3Vec3 eye0, up0, tangent0
  tangent0norm = SceneJS_math_normalizeVec3 tangent0

  #up0norm = [0.0,0.0,0.0]
  #SceneJS_math_cross3Vec3 eye0norm, tangent0norm, up0norm

  # (Transform axis out of the local space of the lookat)
  axis = [tangent0norm[0] * dAngles[0] + tangent0norm[1] * dAngles[0], eye0norm[0] * dAngles[1] + eye0norm[1] * dAngles[1]]
  dAngle = SceneJS_math_lenVec2 dAngles
  rotMat = SceneJS_math_rotationMat4v dAngle, axis

  # Transform the eye vector of the lookat
  eye1 = SceneJS_math_transformVector3 rotMat, eye0

  # Transform the tangent vector of the lookat and then correct for drift
  tangent1 = SceneJS_math_transformVector3 rotMat, tangent0
  tangent1[1] = 0.0   # (Drift is the deviation of the tangent vector from the XZ plane)

  # Transform the up vector using the corrected tangent
  up1 = [0.0,0.0,0.0]
  SceneJS_math_cross3Vec3 eye1, tangent1, up1
  
  result =
    eye: vec3ToRecord eye1
    up: vec3ToRecord up1

orbitLookAtNode = (dAngles, node) ->
  orbitLookAt dAngles,
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'
