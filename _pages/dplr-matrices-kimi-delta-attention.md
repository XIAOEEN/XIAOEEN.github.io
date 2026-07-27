---
layout: default
permalink: /blogs/dplr-matrices-kimi-delta-attention/
title: "Diagonal-Plus-Low-Rank Matrices and Kimi Delta Attention"
description: "How diagonal decay and rank-1 correction combine in DPLR state transitions, and how Kimi Delta Attention constrains this structure for efficient blockwise computation."
date: 2026-07-27
display_date: "July 27, 2026"
language: "English"
topic: "LINEAR ALGEBRA · EFFICIENT SEQUENCE MODELS"
blog_label: "Linear Algebra"
author_profile: false
blog_article: true
blog_sidebar: toc
---

<article class="blog-article" lang="en" markdown="1">

<header class="blog-article__header">
  <h1>Diagonal-Plus-Low-Rank Matrices and Kimi Delta Attention</h1>
  <p class="blog-article__meta"><time datetime="2026-07-27">July 27, 2026</time> · 5 min read</p>
  <p class="blog-article__lead">A diagonal-plus-low-rank transition separates channel-wise memory decay from directional correction. Kimi Delta Attention constrains this expressive structure through variable binding, making it more suitable for efficient blockwise computation on GPUs.</p>
</header>

## 1. Diagonal-Plus-Low-Rank State Transitions

Consider a discrete-time recurrence with a matrix-valued hidden state $S_t$:

$$
S_t
=
\left(
\underbrace{D}_{\text{diagonal matrix}}
-
\underbrace{a_tb_t^\top}_{\text{low-rank / rank-1 matrix}}
\right)S_{t-1}
+ k_tv_t^\top.
$$

The transition combines two complementary operations:

- **Diagonal component $D$**, or $\operatorname{Diag}(\alpha_t)$: independently scales or decays each feature channel. It determines how quickly different components of the memory fade over time.
- **Low-rank component $a_tb_t^\top$**: performs directional erasure and correction in the state space, such as the selective erase operation used by DeltaNet.

The central idea of a diagonal-plus-low-rank (DPLR) matrix is therefore to decompose an otherwise complicated transition matrix into a simple diagonal term and a structured low-rank term. The diagonal part provides fine-grained channel-wise control, while the rank-1 part couples selected directions of the state.

---

## 2. Application to Kimi Delta Attention

Gated DeltaNet uses the recurrence

$$
S_t
=
\alpha_t\left(\mathbf{I}-\beta_tk_tk_t^\top\right)S_{t-1}
+ \beta_tk_tv_t^\top,
$$

where the forget gate $\alpha_t$ is a scalar: the entire state matrix shares one decay rate. Kimi Delta Attention (KDA) replaces this scalar decay with the diagonal matrix $\operatorname{Diag}(\alpha_t)$:

$$
\begin{aligned}
S_t
&=
\left(\mathbf{I}-\beta_tk_tk_t^\top\right)
\operatorname{Diag}(\alpha_t)S_{t-1}
+ \beta_tk_tv_t^\top
\in \mathbb{R}^{d_k\times d_v}, \\
o_t
&= S_t^\top q_t
\in \mathbb{R}^{d_v}.
\end{aligned}
\tag{1}
$$

The resulting transition is DPLR: $\operatorname{Diag}(\alpha_t)$ is its diagonal component, and the remaining correction is rank 1.

<figure class="blog-figure">
  <img src="{{ '/assets/images/blog/dplr-kda-state-update.png' | relative_url }}" alt="Matrix diagram showing a KDA state update as diagonal decay minus a rank-1 correction, followed by a rank-1 write." loading="lazy">
  <figcaption>A KDA state update decomposed into diagonal decay, rank-1 correction, and rank-1 writing.</figcaption>
</figure>

Although a general DPLR transition is expressive, fine-grained diagonal decay can disrupt the symmetry that makes an ordinary sequence of rank-1 transformations easy to organize. Consequently, it cannot be parallelized by applying the standard [compact WY expansion]({{ '/blogs/rank-1-matrix-householder-wy/' | relative_url }}) without modification.

---

## 3. KDA's Core Idea: Variable Binding

A general DPLR transition can be parameterized as

$$
S_t
=
\left(\mathbf{D}-a_tb_t^\top\right)S_{t-1}
+ k_tv_t^\top,
$$

where the two independent control vectors $a_t$ and $b_t$ determine the directions affected by the low-rank erase operation. A fully general network may require separate projections such as

$$
a_t=W_ax_t,
\qquad
b_t=W_bx_t.
$$

KDA instead binds both low-rank directions to the existing key $k_t$, with scalar and diagonal modulation:

$$
a_t=\beta_tk_t,
\qquad
b_t=k_t\odot\alpha_t.
$$

Because

$$
k_t\odot\alpha_t
=
\operatorname{Diag}(\alpha_t)k_t,
$$

the outer product becomes

$$
\begin{aligned}
a_tb_t^\top
&=
(\beta_tk_t)(k_t\odot\alpha_t)^\top \\
&=
\beta_tk_t
\left(\operatorname{Diag}(\alpha_t)k_t\right)^\top \\
&=
\beta_tk_tk_t^\top\operatorname{Diag}(\alpha_t).
\end{aligned}
$$

Substituting this expression into the DPLR transition yields

$$
\begin{aligned}
S_t
&=
\left(
\operatorname{Diag}(\alpha_t)
-
\beta_tk_tk_t^\top\operatorname{Diag}(\alpha_t)
\right)S_{t-1}
+ \beta_tk_tv_t^\top \\
&=
\left(\mathbf{I}-\beta_tk_tk_t^\top\right)
\operatorname{Diag}(\alpha_t)S_{t-1}
+ \beta_tk_tv_t^\top.
\end{aligned}
$$

From the perspective of network parameterization, variable binding is parameter reuse: KDA does not learn two completely independent low-rank directions. It reuses $k_t$ in both factors and obtains $b_t$ by modulating that key with the channel-wise decay vector $\alpha_t$.

This constrained DPLR structure removes unnecessary independent projections and preserves enough algebraic structure to support a UT transform and a diagonally decayed variant of the WY representation. A serial recurrence within each chunk can then be reorganized into GEMM operations that map efficiently to GPU Tensor Cores.

<a class="blog-back-button" href="{{ '/blogs/' | relative_url }}" data-blog-back>← Back to Blogs</a>

</article>
