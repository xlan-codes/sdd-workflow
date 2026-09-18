## Spec economics — weak vs strong spec, same feature, same model

| Measure | Weak spec | Strong spec | Weak ÷ Strong |
|---|---:|---:|---:|
| Rounds to stakeholder-green | 5 | 1 | 5.0× |
| Agent turns | 39 | 7 | 5.6× |
| Fresh input tokens | 49 | 7 | 7.0× |
| Cache read tokens | 2,132,299 | 115,173 | 18.5× |
| Output tokens | 52,922 | 1,327 | 39.9× |
| **Total tokens** | **2,265,840** | **147,243** | **15.4×** |
| **Cost (USD)** | **$1.74** | **$0.17** | **10.2×** |
| **Wall time** | **13m 10s** | **0m 27s** | **28.9×** |

### Per-round detail — weak spec

| Round | Turns | Fresh in | Cache read | Out | Cost | Time |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 11 | 13 | 229,440 | 8,961 | $0.30 | 1m 55s |
| 2 | 4 | 6 | 176,019 | 10,603 | $0.26 | 2m 15s |
| 3 | 14 | 16 | 930,041 | 16,131 | $0.60 | 4m 19s |
| 4 | 6 | 8 | 453,447 | 3,074 | $0.20 | 0m 60s |
| 5 | 4 | 6 | 343,352 | 14,153 | $0.37 | 3m 40s |

> Rounds 2+ are pure ambiguity tax — each one re-reads the whole session (watch the cache column climb).

> Headline: the strong spec finished in 1 round(s) using 15.4× fewer tokens, 10.2× cheaper and 28.9× faster than the weak spec.
> Every weak-spec round after the first is the price of one ambiguity — paid in tokens, dollars and minutes.
