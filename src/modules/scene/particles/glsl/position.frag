uniform vec2 resolution;
uniform sampler2D texturePosition;
uniform sampler2D textureDefaultPosition;
uniform float time;
uniform float speed;
uniform float dieSpeed;
uniform float radius;
uniform float attraction;
uniform float initAnimation;
uniform float deltaDistance;
uniform float curlSize;
uniform vec3 mouse3d;
uniform vec3 attractorPos1;
uniform vec3 attractorPos2;
uniform vec3 attractorPos3;
uniform vec3 attractorPos4;

#pragma glslify: curl = require(./helpers/curl4)

void main() {
    // get the uv position of the current particle within the particle texture (where we're storing the position info)
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // get the actual position info (i.e. a vec4 RGBA value) which corresponds to x,y,z position and life (?)
    vec4 positionInfo = texture2D( texturePosition, uv );

    // create a reference to position and set it to be an interpolation between the 0,1000,0 (i.e. very high up in the air) and the current position
    vec3 position = positionInfo.xyz;

    // get a reference to the life (stored as alpha) and reduce it based on the dieSpeed
    float life = positionInfo.a - dieSpeed;

    // if this particle is out of life...
    if(life < 0.0) {

        // restore its default position
        // positionInfo = texture2D( textureDefaultPosition, uv );
        // position = positionInfo.xyz * (1.0 + sin(time * 15.0) * 0.2) * 0.4 * radius;

        // randomly choose from one of the attractor positions (keypoints)
        if (uv.x < 0.25){
            position = attractorPos1;
        } else if (uv.x < 0.5){
            position = attractorPos2;
        } else if (uv.x < 0.75){
            position = attractorPos3;
        } else if (uv.x < 1.0){
            position = attractorPos4;
        }


        life = 0.5 + fract(positionInfo.w * 21.4131 + time);
    } else {
        // move towards the follow position


        // move towards the follow position 1
        vec3 delta1 = attractorPos1 - position;
        float deltaLength1 = length(delta1);
        

        // move towards the follow position 2
        vec3 delta2 = attractorPos2 - position;
        float deltaLength2 = length(delta2);

        // move towards the follow position 3
        vec3 delta3 = attractorPos3 - position;
        float deltaLength3 = length(delta3);

        // move towards the follow position 4
        vec3 delta4 = attractorPos4 - position;
        float deltaLength4 = length(delta4);
        
        position += delta1 * (0.5 + life * 0.01) * attraction * (1.0 - smoothstep(100.0, 500.0, deltaLength1));
        position += delta2 * (0.5 + life * 0.01) * attraction * (1.0 - smoothstep(100.0, 500.0, deltaLength2));
        position += delta3 * (0.5 + life * 0.01) * attraction * (1.0 - smoothstep(100.0, 500.0, deltaLength3));
        position += delta4 * (0.5 + life * 0.01) * attraction * (1.0 - smoothstep(100.0, 500.0, deltaLength4));


        // apply curling motion
        position += curl(position * curlSize, time * 0.2, 0.2) * speed;
    }

    gl_FragColor = vec4(position, life);

}

