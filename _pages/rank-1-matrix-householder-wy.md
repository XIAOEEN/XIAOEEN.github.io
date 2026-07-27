---
layout: default
permalink: /blogs/rank-1-matrix-householder-wy/
title: "Rank-1 Matrices, Householder Transformations, and the WY Representation"
description: "From rank-1 outer products to Householder transformations and the compact WY representation: why low-rank structure matters for blockwise GPU computation."
date: 2026-04-15
display_date: "April, 15, 2026"
language: "English"
topic: "LINEAR ALGEBRA · EFFICIENT SEQUENCE MODELS"
blog_label: "Linear Algebra"
author_profile: false
blog_article: true
blog_sidebar: toc
---

<article class="blog-article" lang="en" markdown="1">

<header class="blog-article__header">
  <h1>Rank-1 Matrices, Householder Transformations, and the WY Representation</h1>
  <p class="blog-article__meta"><time datetime="2026-04-15">April, 15, 2026</time> · 8 min read</p>
  <p class="blog-article__lead">Starting from a simple vector outer product, this note develops the compact matrix form that turns a sequence of rank-1 transformations into GPU-friendly blockwise computation.</p>
</header>

## 1. What Is a Rank-1 Matrix?

The rank of a matrix is the size of a maximal linearly independent set of its rows or columns. A rank-1 matrix can be written as the outer product of a column vector and a row vector:

$$
A = uv^\top,
$$

where $u \in \mathbb{R}^{m}$ and $v \in \mathbb{R}^{n}$, so $A \in \mathbb{R}^{m \times n}$.

Strictly speaking, $uv^\top$ has rank 1 only when both $u$ and $v$ are nonzero. If either vector is zero, the result is the rank-0 zero matrix. Therefore, the outer product of two nonzero column vectors—one multiplied by the transpose of the other—is a rank-1 matrix.

### A Simple Example

Let

$$
u = \begin{bmatrix} 1 \\ 2 \end{bmatrix},
\qquad
v = \begin{bmatrix} 3 \\ 4 \end{bmatrix}.
$$

Their outer product is

$$
uv^\top
= \begin{bmatrix} 1 \\ 2 \end{bmatrix}
  \begin{bmatrix} 3 & 4 \end{bmatrix}
= \begin{bmatrix} 3 & 4 \\ 6 & 8 \end{bmatrix}.
$$

The second row is exactly twice the first. Although this $2 \times 2$ matrix contains four entries, all of its information is determined by two one-dimensional vectors.

## 2. Rank-1 Updates in DeltaNet

Consider a DeltaNet-style state update:

$$
S_t = \left(\mathbf{I} - \beta_t k_t k_t^\top\right)S_{t-1}
      + \beta_t k_t v_t^\top.
$$

Both $k_tk_t^\top$ and $k_tv_t^\top$ have rank at most 1. Intuitively, each step does not perform an arbitrary global rewrite of the memory matrix $S$. Instead, it erases and writes information along the single direction specified by $k_t$.

## 3. Householder Transformations and the Serial Bottleneck

A Householder transformation commonly used in numerical linear algebra has the form

$$
H = \mathbf{I} - \beta vv^\top.
$$

It has the same “identity minus a rank-1 matrix” structure. If we apply $r$ such transformations, directly evaluating

$$
P_r = H_1H_2\cdots H_r
$$

creates a dependency chain: every matrix multiplication must wait for the preceding one. Modern GPUs are most efficient on large, regular matrix multiplications (GEMMs), so explicitly constructing and multiplying $r$ full $d_k \times d_k$ transformation matrices is usually a poor implementation strategy.

## 4. The Compact WY Representation

The central idea of the compact WY representation is to express a product of rank-1 transformations using two tall, narrow matrices:

$$
P_r = \mathbf{I} - W_rY_r^\top.
$$

Define

$$
Y_r = \begin{bmatrix} k_1 & k_2 & \cdots & k_r \end{bmatrix}
\in \mathbb{R}^{d_k \times r},
$$

and

$$
W_r = \begin{bmatrix} w_1 & w_2 & \cdots & w_r \end{bmatrix}
\in \mathbb{R}^{d_k \times r}.
$$

Then

$$
W_rY_r^\top = \sum_{i=1}^{r} w_i k_i^\top.
$$

In other words, the representation packages $r$ rank-1 matrices into a single low-rank matrix product.

For example, if $d_k=128$ and the chunk size is $r=64$, both $W_r$ and $Y_r$ have shape $128 \times 64$, while $Y_r^\top$ has shape $64 \times 128$.

## 5. The Two-Step Case: Where Does $W$ Come From?

To keep the multiplication order consistent with the recurrence, consider

$$
P_2 = H_1H_2
= \left(\mathbf{I}-\beta_1k_1k_1^\top\right)
  \left(\mathbf{I}-\beta_2k_2k_2^\top\right).
$$

Expanding the product gives

$$
\begin{aligned}
P_2
= {} & \mathbf{I}
- \beta_1k_1k_1^\top
- \beta_2k_2k_2^\top \\
& + \beta_1\beta_2k_1\left(k_1^\top k_2\right)k_2^\top.
\end{aligned}
$$

Define

$$
w_1 = \beta_1k_1
$$

and

$$
w_2
= \beta_2\left(k_2-w_1\left(k_1^\top k_2\right)\right).
$$

The product can now be written as

$$
P_2 = \mathbf{I} - w_1k_1^\top - w_2k_2^\top
    = \mathbf{I} - W_2Y_2^\top.
$$

## 6. The General Recurrence

Assume that the first $r-1$ transformations have already been represented as

$$
P_{r-1}=\mathbf{I}-W_{r-1}Y_{r-1}^\top.
$$

After introducing the $r$-th transformation,

$$
P_r=P_{r-1}H_r
=\left(\mathbf{I}-W_{r-1}Y_{r-1}^\top\right)
 \left(\mathbf{I}-\beta_rk_rk_r^\top\right).
$$

Collecting terms gives

$$
P_r
= \mathbf{I}-W_{r-1}Y_{r-1}^\top
- \underbrace{\beta_r\left(k_r-W_{r-1}\left(Y_{r-1}^\top k_r\right)\right)}_{w_r}k_r^\top.
$$

Therefore, the new auxiliary vector is

$$
w_r
= \beta_r\left(k_r-W_{r-1}\left(Y_{r-1}^\top k_r\right)\right)
= \beta_r\left(k_r-\sum_{i=1}^{r-1}w_i\left(k_i^\top k_r\right)\right).
$$

Appending $w_r$ and $k_r$ to $W_{r-1}$ and $Y_{r-1}$, respectively, produces $W_r$ and $Y_r$.

<div class="blog-note" markdown="1">
**A note on multiplication order.** If the transformations are ordered as $H_rH_{r-1}\cdots H_1$, the symmetry of each $H_i$ lets us transpose the expression above and obtain the corresponding $\mathbf{I}-Y_rW_r^\top$ form. The multiplication order must remain fixed throughout a derivation; the two conventions should not be mixed.
</div>

## 7. Why WY Is Better Suited to Blockwise Computation

When the accumulated transformation acts on an initial state matrix $S_0$,

$$
P_rS_0
= \left(\mathbf{I}-W_rY_r^\top\right)S_0
= S_0-W_r\left(Y_r^\top S_0\right).
$$

For $d_k=128$ and $r=64$, the computation becomes two regular GEMMs:

1. Compute $Y_r^\top S_0$:

   $$
   (64\times128)(128\times128)\rightarrow64\times128.
   $$

2. Compute $W_r(Y_r^\top S_0)$:

   $$
   (128\times64)(64\times128)\rightarrow128\times128.
   $$

This form avoids explicitly constructing and serially multiplying $r$ full $128\times128$ transformation matrices. The dominant work is instead expressed through matrix multiplication kernels that GPUs execute efficiently.

The WY representation does not, however, make every dependency disappear. Constructing $W_r$ still involves a structured recurrence. Practical systems typically combine blocking, batching, or triangular algorithms to build the auxiliary matrices efficiently. The most direct benefit of WY is that the **storage and application of an accumulated transformation** become compact low-rank matrix operations.

<a class="blog-back-button" href="{{ '/blogs/' | relative_url }}" data-blog-back>← Back to Blogs</a>

</article>
