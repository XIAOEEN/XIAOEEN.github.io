---
layout: default
permalink: /blogs/deltanet-gated-deltanet-online-learning/
title: "DeltaNet and Gated DeltaNet Through the Lens of Online Learning and Gradient Descent"
description: "A step-by-step view of linear attention, DeltaNet, and Gated DeltaNet as online optimization rules over fast-weight associative memory."
date: 2026-07-24
display_date: "July 24, 2026"
language: "English"
topic: "ONLINE LEARNING · LINEAR ATTENTION"
blog_label: "Linear Attention"
author_profile: false
blog_article: true
blog_sidebar: toc
---

<article class="blog-article" lang="en" markdown="1">

<header class="blog-article__header">
  <h1>DeltaNet and Gated DeltaNet Through the Lens of Online Learning and Gradient Descent</h1>
  <p class="blog-article__meta"><time datetime="2026-07-24">July 24, 2026</time> · 6 min read</p>
  <p class="blog-article__lead">Linear attention can be interpreted as an online learning system whose recurrent state acts as fast-weight associative memory. This perspective makes the erase rule in DeltaNet—and the additional forgetting gate in Gated DeltaNet—particularly intuitive.</p>
</header>

## 1. Traditional Linear Attention

Traditional linear attention maintains a matrix-valued hidden state $S_t$ that stores a temporary mapping between keys and values—an associative memory:

$$
S_t = S_{t-1} + k_tv_t^\top,
\qquad
o_t = S_t^\top q_t.
$$

From the fast-weight perspective, the update of $S_t$ can be interpreted as one step of online gradient descent on the following instantaneous objective:

$$
\mathcal{L}_t(S) = -\left\langle S^\top k_t, v_t \right\rangle.
$$

Because

$$
\nabla_S \mathcal{L}_t(S) = -k_tv_t^\top,
$$

a unit gradient step recovers the additive update $S_t=S_{t-1}+k_tv_t^\top$.

The limitation is that this objective only reinforces the current key-value association. It contains no explicit forgetting criterion. As the context grows, the norm of the accumulated state can continue to increase, while old associations interfere with the retrieval of newer information.

---

## 2. DeltaNet: Online Correction Through Reconstruction Loss

DeltaNet reinterprets memory updates as online gradient descent on a reconstruction error. It first defines the objective

$$
\mathcal{L}_t(S)
= \frac{1}{2}\left\lVert S^\top k_t-v_t\right\rVert^2.
$$

The gradient with respect to $S$, evaluated at the previous state, is

$$
\nabla_S\mathcal{L}_t(S_{t-1})
= k_t\left(S_{t-1}^\top k_t-v_t\right)^\top.
$$

Taking a gradient step with learning rate $\beta_t$ gives

$$
\begin{aligned}
S_t
&= S_{t-1}-\beta_t\nabla_S\mathcal{L}_t(S_{t-1}) \\
&= \left(\mathbf{I}-\beta_tk_tk_t^\top\right)S_{t-1}
   + \beta_tk_tv_t^\top.
\end{aligned}
$$

Compared with ordinary linear attention, this update contains two distinct operations:

1. **Selective erasure:**

   $$
   \left(\mathbf{I}-\beta_tk_tk_t^\top\right)S_{t-1}.
   $$

   Before writing a new association, the model removes the component of the old memory that conflicts with the current key direction $k_t$. The operator has the same identity-minus-rank-1 structure as a Householder transformation, although it is a strict Householder reflector only for a particular choice of $\beta_t$.

2. **Writing the correction:**

   $$
   \beta_tk_tv_t^\top.
   $$

   The new key-value association is then written into memory.

The correction applied at each step is structured through rank-1 outer products. This structure can be organized with a compact WY representation for efficient blockwise computation, combining the online adaptation of a recurrent model with matrix operations that are more suitable for parallel training.

---

## 3. Gated DeltaNet: Introducing Weight Decay

DeltaNet resolves direct conflicts between associations, but old memory outside the erased direction may still remain indefinitely. Over very long sequences, stale information can continue to occupy memory capacity and interfere with retrieval.

Gated DeltaNet introduces a scalar forget gate $\alpha_t\in[0,1]$:

$$
S_t
= \alpha_t\left(\mathbf{I}-\beta_tk_tk_t^\top\right)S_{t-1}
+ \beta_tk_tv_t^\top.
$$

Each update can be understood as three operations:

1. **Global decay:** multiply the previous memory by $\alpha_t$, reducing the magnitude of all old information.
2. **Selective erasure:** remove memory that conflicts specifically with the current $k_t$ direction.
3. **Write:** add the new mapping $\beta_tk_tv_t^\top$.

The forget gate acts like a data-dependent weight-decay factor on the fast weights. It controls memory lifespan and actively suppresses historical noise in long-context processing.

### A Multiplicative Positional-Encoding Perspective

Rotary positional encoding injects position through orthogonal rotations, whose norm-preserving structure maintains relative geometric relationships. From the recurrent-transition perspective, however,

$$
\alpha_t\left(\mathbf{I}-\beta_tk_tk_t^\top\right)
$$

is a data-dependent, dynamically learned state-transition matrix. It relaxes the orthogonality constraint: the magnitude of memory is allowed to decay naturally over time.

From this viewpoint, $\alpha_t$ gives Gated DeltaNet an interpretation as a learned multiplicative positional mechanism. Relative distance is reflected through recurrent decay rather than a fixed rotation schedule, offering a different route to long-context extrapolation.

<div class="blog-note" markdown="1">
**Transition-matrix interpretation.** The introduction of $\alpha_t$ lets Gated DeltaNet be viewed as a data-driven multiplicative positional encoding that relaxes the orthogonality constraint of standard RoPE and explicitly models memory decay over distance.
</div>

---

## 4. Comparing the Three Mechanisms

<div class="blog-table-scroll" markdown="1">

| Mechanism | State update | Interpretation | Long-context limitation |
| --- | --- | --- | --- |
| **Linear Attention** | $S_t=S_{t-1}+k_tv_t^\top$ | Accumulates every new association without an explicit bound | Remembers without forgetting; old information increasingly interferes |
| **DeltaNet** | $S_t=(\mathbf{I}-\beta_tk_tk_t^\top)S_{t-1}+\beta_tk_tv_t^\top$ | Selectively erases and writes along the $k_t$ direction | Unrelated stale information can remain indefinitely |
| **Gated DeltaNet** | $S_t=\alpha_t(\mathbf{I}-\beta_tk_tk_t^\top)S_{t-1}+\beta_tk_tv_t^\top$ | Combines selective erasure with global forgetting | A scalar decay gate improves long-context memory management but decays all directions globally |

</div>

<a class="blog-back-button" href="{{ '/blogs/' | relative_url }}" data-blog-back>← Back to Blogs</a>

</article>
