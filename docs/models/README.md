# astronaut.bin

Particle positions sampled from the surface of the **Astronaut** model in Google's
[`model-viewer` shared assets](https://github.com/google/model-viewer/tree/master/packages/shared-assets),
licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Format (little-endian): `uint32` point count, then `int16[count * 3]` xyz positions
normalised to `[-1, 1] * 32767`, then `uint8[count]` texture brightness at each point
(dark texels are the visor).
