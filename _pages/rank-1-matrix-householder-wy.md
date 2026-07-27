---
layout: default
permalink: /blogs/rank-1-matrix-householder-wy/
title: "Rank-1 Matrix（秩-1 矩阵）、Householder 与 WY Representation"
description: "从秩-1 外积到 Householder 变换与紧凑 WY 表示，理解其在分块并行计算中的作用。"
---

<article class="blog-article" lang="zh-CN" markdown="1">

<a class="blog-back-link" href="{{ '/blogs/' | relative_url }}">← 返回 Blogs</a>

<header class="blog-article__header">
  <p class="blog-eyebrow">LINEAR ALGEBRA · EFFICIENT SEQUENCE MODELS</p>
  <h1>Rank-1 Matrix（秩-1 矩阵）、Householder 与 WY Representation</h1>
  <p class="blog-article__meta"><time datetime="2026-07-27">2026-07-27</time> · 约 8 分钟阅读</p>
  <p class="blog-article__lead">从一个简单的向量外积出发，逐步理解多个秩-1 更新如何被压缩成适合 GPU 批量计算的矩阵形式。</p>
</header>

## 1. 什么是秩-1 矩阵？

矩阵的秩（Rank）表示其行向量或列向量中极大线性无关组的大小。一个秩-1 矩阵可以写成一个列向量与一个行向量的外积：

$$
A = u v^\top,
$$

其中 $u \in \mathbb{R}^{m}$，$v \in \mathbb{R}^{n}$，因此 $A \in \mathbb{R}^{m \times n}$。

需要注意：只有当 $u$ 和 $v$ 都是非零向量时，$uv^\top$ 的秩才严格等于 1；如果其中任意一个是零向量，结果就是秩-0 的零矩阵。换句话说，两个非零列向量中的一个乘以另一个的转置，得到的就是秩-1 矩阵。

### 一个简单例子

令

$$
u = \begin{bmatrix} 1 \\ 2 \end{bmatrix},
\qquad
v = \begin{bmatrix} 3 \\ 4 \end{bmatrix}.
$$

它们的外积为

$$
uv^\top
= \begin{bmatrix} 1 \\ 2 \end{bmatrix}
  \begin{bmatrix} 3 & 4 \end{bmatrix}
= \begin{bmatrix} 3 & 4 \\ 6 & 8 \end{bmatrix}.
$$

第二行恰好是第一行的 2 倍。这个 $2 \times 2$ 矩阵看似包含四个元素，本质上却只由两个一维向量决定。

## 2. DeltaNet 中的秩-1 更新

考虑 DeltaNet 风格的状态更新：

$$
S_t = \left(\mathbf{I} - \beta_t k_t k_t^\top\right) S_{t-1}
      + \beta_t k_t v_t^\top.
$$

其中，$k_tk_t^\top$ 与 $k_tv_t^\top$ 都是秩至多为 1 的矩阵。直观上，每一步并不是对整个记忆矩阵 $S$ 做任意的全局改写，而是沿着由 $k_t$ 指定的单一方向进行低维度的擦除与写入。

## 3. 从 Householder 变换到串行瓶颈

数值线性代数中常见的 Householder 变换可以写成

$$
H = \mathbf{I} - \beta vv^\top.
$$

它同样具有“单位矩阵减去秩-1 矩阵”的结构。若连续应用 $r$ 个这样的变换，直接计算

$$
P_r = H_1H_2\cdots H_r
$$

会形成一条依赖链：后一次矩阵乘法必须等待前一次完成。现代 GPU 更擅长大规模、规则的矩阵乘法（GEMM），因此逐个构造并连乘完整的 $d_k \times d_k$ 变换矩阵通常不是理想实现。

## 4. WY Representation

紧凑 WY 表示的核心思想，是把一串秩-1 变换的乘积写成两个“高而窄”的矩阵：

$$
P_r = \mathbf{I} - W_rY_r^\top.
$$

令

$$
Y_r = \begin{bmatrix} k_1 & k_2 & \cdots & k_r \end{bmatrix}
\in \mathbb{R}^{d_k \times r},
$$

并令

$$
W_r = \begin{bmatrix} w_1 & w_2 & \cdots & w_r \end{bmatrix}
\in \mathbb{R}^{d_k \times r}.
$$

于是

$$
W_rY_r^\top = \sum_{i=1}^{r} w_i k_i^\top,
$$

也就是将 $r$ 个秩-1 矩阵统一打包到一次低秩矩阵乘法中。

例如，当 $d_k=128$、Chunk Size $r=64$ 时，$W_r$ 与 $Y_r$ 的大小都是 $128 \times 64$，而 $Y_r^\top$ 的大小是 $64 \times 128$。

## 5. 两步情形：$W$ 是怎样产生的？

为了保持乘积方向与递推公式一致，这里采用

$$
P_2 = H_1H_2
= \left(\mathbf{I}-\beta_1k_1k_1^\top\right)
  \left(\mathbf{I}-\beta_2k_2k_2^\top\right).
$$

展开可得

$$
\begin{aligned}
P_2
= {} & \mathbf{I}
- \beta_1k_1k_1^\top
- \beta_2k_2k_2^\top \\
& + \beta_1\beta_2k_1\left(k_1^\top k_2\right)k_2^\top.
\end{aligned}
$$

定义

$$
w_1 = \beta_1k_1,
$$

以及

$$
w_2
= \beta_2\left(k_2-w_1\left(k_1^\top k_2\right)\right),
$$

就可以写成

$$
P_2 = \mathbf{I} - w_1k_1^\top - w_2k_2^\top
    = \mathbf{I} - W_2Y_2^\top.
$$

## 6. 一般递推公式

假设前 $r-1$ 个变换已经表示为

$$
P_{r-1}=\mathbf{I}-W_{r-1}Y_{r-1}^\top.
$$

加入第 $r$ 个变换后，

$$
P_r=P_{r-1}H_r
=\left(\mathbf{I}-W_{r-1}Y_{r-1}^\top\right)
 \left(\mathbf{I}-\beta_rk_rk_r^\top\right).
$$

整理得到

$$
P_r
= \mathbf{I}-W_{r-1}Y_{r-1}^\top
- \underbrace{\beta_r\left(k_r-W_{r-1}\left(Y_{r-1}^\top k_r\right)\right)}_{w_r}k_r^\top.
$$

因此，新的辅助向量满足

$$
w_r
= \beta_r\left(k_r-W_{r-1}\left(Y_{r-1}^\top k_r\right)\right)
= \beta_r\left(k_r-\sum_{i=1}^{r-1}w_i\left(k_i^\top k_r\right)\right).
$$

将 $w_r$ 和 $k_r$ 分别追加到 $W_{r-1}$ 与 $Y_{r-1}$ 后，就得到 $W_r$ 和 $Y_r$。

<div class="blog-note" markdown="1">
**关于乘积方向：** 如果使用 $H_rH_{r-1}\cdots H_1$ 的顺序，由于每个 $H_i$ 都是对称矩阵，可以对上式取转置，得到相应的 $\mathbf{I}-Y_rW_r^\top$ 形式。推导时必须固定乘积方向，不能混用两种记号。
</div>

## 7. WY 为什么更适合分块计算？

当累积变换作用于初始状态矩阵 $S_0$ 时，

$$
P_rS_0
= \left(\mathbf{I}-W_rY_r^\top\right)S_0
= S_0-W_r\left(Y_r^\top S_0\right).
$$

若 $d_k=128$、$r=64$，计算可以拆成两个规则的 GEMM：

1. 计算 $Y_r^\top S_0$：

   $$
   (64\times128)(128\times128)\rightarrow64\times128.
   $$

2. 计算 $W_r(Y_r^\top S_0)$：

   $$
   (128\times64)(64\times128)\rightarrow128\times128.
   $$

这种形式避免了显式构造并串行连乘 $r$ 个完整的 $128\times128$ 变换矩阵，使主要计算落到 GPU 高度优化的矩阵乘法内核上。

不过，WY 表示并不意味着所有依赖都自动消失：$W_r$ 的构造本身仍包含结构化递推。实际系统通常结合分块、批处理或三角结构算法高效生成辅助矩阵；WY 最直接的收益，是让**累积变换的存储与应用**转化为紧凑的低秩矩阵运算。

## 8. 总结

- 非零向量的外积 $uv^\top$ 是秩-1 矩阵。
- DeltaNet 中的擦除项和写入项都可以理解为沿单一方向的秩-1 更新。
- Householder 变换具有 $\mathbf{I}-\beta vv^\top$ 的结构。
- 紧凑 WY 表示把多个秩-1 变换组织为 $\mathbf{I}-WY^\top$。
- 对一个 Chunk 的累积变换可以通过低秩矩阵和 GEMM 高效应用，但辅助矩阵的构造仍需正确处理递推依赖。

<a class="blog-back-link blog-back-link--footer" href="{{ '/blogs/' | relative_url }}">← 返回 Blogs</a>

</article>
