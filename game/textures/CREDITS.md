# Texture & Model Credits

All assets sourced from [Poly Haven](https://polyhaven.com) (CC0 — public domain, no attribution required, credited here anyway as good practice).

## Textures (`textures/`)

| Files | Poly Haven asset | URL |
|---|---|---|
| `forest_albedo.jpg`, `forest_normal.jpg`, `forest_rough.jpg` | Forest Ground 04 | https://polyhaven.com/a/forest_ground_04 |
| `dirt_albedo.jpg`, `dirt_normal.jpg`, `dirt_rough.jpg` | Dirt Floor | https://polyhaven.com/a/dirt_floor |
| `bark_albedo.jpg`, `bark_normal.jpg`, `bark_rough.jpg` | Bark Brown 02 | https://polyhaven.com/a/bark_brown_02 |
| `concrete_albedo.jpg`, `concrete_normal.jpg`, `concrete_rough.jpg` | Dirty Concrete | https://polyhaven.com/a/dirty_concrete |
| `rust_albedo.jpg`, `rust_normal.jpg`, `rust_rough.jpg` | Rusty Metal | https://polyhaven.com/a/rusty_metal |
| `grass_albedo.jpg`, `grass_normal.jpg`, `grass_rough.jpg` | Leafy Grass | https://polyhaven.com/a/leafy_grass |
| `sand_albedo.jpg`, `sand_normal.jpg`, `sand_rough.jpg` | Coast Sand 01 | https://polyhaven.com/a/coast_sand_01 |
| `rock_albedo.jpg`, `rock_normal.jpg`, `rock_rough.jpg` | Rock Face | https://polyhaven.com/a/rock_face |
| `wood_albedo.jpg`, `wood_normal.jpg`, `wood_rough.jpg` | Wood Planks | https://polyhaven.com/a/wood_planks |

Downloaded at 1k JPEG resolution (albedo/diffuse, OpenGL-convention normal map, roughness).

## Models (`models/`)

| Folder | Poly Haven asset | URL |
|---|---|---|
| `dead_tree_trunk_02/` | Dead Tree Trunk 02 | https://polyhaven.com/a/dead_tree_trunk_02 |
| `tree_stump_01/` | Tree Stump 01 | https://polyhaven.com/a/tree_stump_01 |

glTF 2.0 at 1k texture resolution, used as sparse "hero" props. The bulk forest is
built from batched procedural geometry instead — Poly Haven's full tree scans run
~900 MB of mesh data each, which is impractical for a forest of a thousand trees.
