---
layout: default
permalink: /blogs/
title: "Blogs"
author_profile: false
blog_index: true
---

{% assign blog_articles = site.pages | where: "blog_article", true | sort: "date" | reverse %}

<section class="blog-index" aria-labelledby="blog-index-title">
  <a class="blog-index__back" href="{{ '/' | relative_url }}">‹&nbsp;&nbsp;Back to Home</a>

  <header class="blog-index__header">
    <h1 id="blog-index-title">📝 Blogs</h1>
  </header>

  <div class="blog-index__list">
    {% for article in blog_articles %}
      <a class="blog-list-item" href="{{ article.url | relative_url }}" aria-label="Read {{ article.title }}">
        <span class="blog-list-item__body">
          <strong class="blog-list-item__title">{{ article.title }}</strong>
          <span class="blog-list-item__meta">
            <time datetime="{{ article.date | date: '%Y-%m-%d' }}">{% if article.display_date %}{{ article.display_date }}{% else %}{{ article.date | date: "%B %d, %Y" }}{% endif %}</time>
            {% if article.blog_label %}<span class="blog-list-item__badge">{{ article.blog_label }}</span>{% endif %}
          </span>
          <span class="blog-list-item__summary">{{ article.description }}</span>
        </span>
        <span class="blog-list-item__chevron" aria-hidden="true">›</span>
      </a>
    {% endfor %}
  </div>
</section>
