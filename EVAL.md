# Eval results

Model `gemma4:e4b` via Ollama, run on 2026-10-26 (darwin/arm64), temperature 0, one run.
Images: PlantVillage (CC0), two per class, see `samples/README.md`. Single leaves on plain backgrounds, which is easier than field photos.
The first full run on these images exposed a design flaw (the model never named the crop), so the crop-selector design was then tuned on a separate set of 18 PlantVillage images (rows 7 away from these, one per class, not in this repo). Neighbouring rows can show the same leaf, so this is not a clean hold-out. Treat the numbers as optimistic.
"Raw" takes the model's claim at face value. "Validated" is what the app shows after the code-side checks.
With two images per class, one image is ~3 points. Treat this as a smoke test, not a benchmark.

## Grower names the crop (default use)

34 images: 24 diseased, 10 healthy, 0 background-only.

| Metric | Raw model | Validated |
|---|---|---|
| Healthy-vs-problem right (34 leaf images) | 94.1% | 94.1% |
| Healthy-vs-problem flatly wrong (count) | 2 | 1 |
| Abstained ("can't tell", count) | 0 | 1 |
| Named a specific disease (count) | 3 | 3 |
| Of those, named the right disease | 3 (100%) | 3 (100%) |
| Exactly right overall, crop + condition | 38.2% | 38.2% |

- Diseased leaves where the exact disease was named: 12.5%
- Healthy leaves called healthy: 100%
- Crop identified: 100%
- Background-only photos rejected: n/a
- Code-side checks changed the verdict on 1 of 34 images
- Latency per image: median 1823 ms, p95 2402 ms
- Per class (validated, correct/total): apple.apple_scab 1/2; apple.healthy 2/2; corn.common_rust 0/2; corn.healthy 2/2; grape.black_rot 0/2; pepper.bacterial_spot 1/2; pepper.healthy 2/2; potato.early_blight 0/2; potato.healthy 2/2; potato.late_blight 0/2; tomato.bacterial_spot 0/2; tomato.early_blight 0/2; tomato.healthy 2/2; tomato.late_blight 1/2; tomato.leaf_mold 0/2; tomato.septoria_leaf_spot 0/2; tomato.yellow_leaf_curl_virus 0/2

## Auto-detect the crop (model must name it)

36 images: 24 diseased, 10 healthy, 2 background-only.

| Metric | Raw model | Validated |
|---|---|---|
| Healthy-vs-problem right (34 leaf images) | 94.1% | 32.4% |
| Healthy-vs-problem flatly wrong (count) | 2 | 2 |
| Abstained ("can't tell", count) | 0 | 21 |
| Named a specific disease (count) | 0 | 0 |
| Of those, named the right disease | 0 (n/a) | 0 (n/a) |
| Exactly right overall, crop + condition | 5.6% | 5.6% |

- Diseased leaves where the exact disease was named: 0%
- Healthy leaves called healthy: 0%
- Crop identified: 5.9%
- Background-only photos rejected: 100%
- Code-side checks changed the verdict on 21 of 36 images
- Latency per image: median 2021 ms, p95 3284 ms
- Per class (validated, correct/total): apple.apple_scab 0/2; apple.healthy 0/2; corn.common_rust 0/2; corn.healthy 0/2; grape.black_rot 0/2; not_a_plant 2/2; pepper.bacterial_spot 0/2; pepper.healthy 0/2; potato.early_blight 0/2; potato.healthy 0/2; potato.late_blight 0/2; tomato.bacterial_spot 0/2; tomato.early_blight 0/2; tomato.healthy 0/2; tomato.late_blight 0/2; tomato.leaf_mold 0/2; tomato.septoria_leaf_spot 0/2; tomato.yellow_leaf_curl_virus 0/2
