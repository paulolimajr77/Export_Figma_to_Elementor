# Estrutura HTML dos Componentes WordPress Elementor

Documentação detalhada com tags HTML e classes de todos os widgets Elementor Free, Pro, WooCommerce, Loop Builder, Carroséis, Experimentais e WordPress.

---

## WIDGETS BÁSICOS (ELEMENTOR FREE)

### w:container
```html
<div class="elementor-container">
  <div class="elementor-row">
    <!-- Inner content -->
  </div>
</div>
```

### w:inner-container
```html
<div class="elementor-inner-container">
  <!-- Child elements -->
</div>
```

### w:heading
```html
<div class="elementor-widget elementor-widget-heading">
  <div class="elementor-widget-container">
    <h1 class="elementor-heading-title elementor-size-default">
      Heading Text
    </h1>
  </div>
</div>
```

### w:text-editor
```html
<div class="elementor-widget elementor-widget-text-editor">
  <div class="elementor-widget-container">
    <div class="elementor-text-editor elementor-clearfix">
      <p>Text content here</p>
    </div>
  </div>
</div>
```

### w:image
```html
<div class="elementor-widget elementor-widget-image">
  <div class="elementor-widget-container">
    <img src="image-url.jpg" class="attachment-full" alt="Image Alt Text">
  </div>
</div>
```

### w:video
```html
<div class="elementor-widget elementor-widget-video">
  <div class="elementor-widget-container">
    <div class="elementor-video-container">
      <iframe src="video-url" 
              title="Video"
              frameborder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture">
      </iframe>
    </div>
  </div>
</div>
```

### w:button
```html
<div class="elementor-widget elementor-widget-button">
  <div class="elementor-widget-container">
    <div class="elementor-button-wrapper">
      <a href="#" class="elementor-button elementor-button-link elementor-size-md">
        <span class="elementor-button-content-wrapper">
          <span class="elementor-button-text">Button Text</span>
        </span>
      </a>
    </div>
  </div>
</div>
```

### w:divider
```html
<div class="elementor-widget elementor-widget-divider">
  <div class="elementor-widget-container">
    <div class="elementor-divider">
      <span class="elementor-divider-separator"></span>
    </div>
  </div>
</div>
```

### w:spacer
```html
<div class="elementor-widget elementor-widget-spacer">
  <div class="elementor-widget-container">
    <div class="elementor-spacer" style="height: 20px;"></div>
  </div>
</div>
```

### w:icon
```html
<div class="elementor-widget elementor-widget-icon">
  <div class="elementor-widget-container">
    <div class="elementor-icon-wrapper">
      <div class="elementor-icon">
        <i class="fas fa-star"></i>
      </div>
    </div>
  </div>
</div>
```

### w:icon-box
```html
<div class="elementor-widget elementor-widget-icon-box">
  <div class="elementor-widget-container">
    <div class="elementor-icon-box-wrapper">
      <div class="elementor-icon-box-icon">
        <i class="fas fa-check"></i>
      </div>
      <div class="elementor-icon-box-content">
        <h3 class="elementor-icon-box-title">Title</h3>
        <p class="elementor-icon-box-description">Description</p>
      </div>
    </div>
  </div>
</div>
```

### w:image-box
```html
<div class="elementor-widget elementor-widget-image-box">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper">
      <figure class="elementor-image-box-img">
        <img src="image-url.jpg" alt="Image">
      </figure>
      <div class="elementor-image-box-content">
        <h3 class="elementor-image-box-title">Title</h3>
        <p class="elementor-image-box-description">Description</p>
      </div>
    </div>
  </div>
</div>
```

### w:star-rating
```html
<div class="elementor-widget elementor-widget-star-rating">
  <div class="elementor-widget-container">
    <div class="elementor-star-rating">
      <i class="fas fa-star elementor-star-full"></i>
      <i class="fas fa-star elementor-star-full"></i>
      <i class="fas fa-star elementor-star-half"></i>
      <i class="fas fa-star elementor-star-empty"></i>
      <i class="fas fa-star elementor-star-empty"></i>
    </div>
  </div>
</div>
```

### w:counter
```html
<div class="elementor-widget elementor-widget-counter">
  <div class="elementor-widget-container">
    <div class="elementor-counter-box">
      <div class="elementor-counter-title">Title</div>
      <div class="elementor-counter-number-wrapper">
        <span class="elementor-counter-number" data-to-value="100">0</span>
      </div>
    </div>
  </div>
</div>
```

### w:progress
```html
<div class="elementor-widget elementor-widget-progress">
  <div class="elementor-widget-container">
    <div class="elementor-progress-wrapper">
      <div class="elementor-progress-title">Progress Title</div>
      <div class="elementor-progress-bar">
        <div class="elementor-progress-fill" style="width: 75%;"></div>
      </div>
    </div>
  </div>
</div>
```

### w:tabs
```html
<div class="elementor-widget elementor-widget-tabs">
  <div class="elementor-widget-container">
    <div class="elementor-tabs">
      <div class="elementor-tabs-wrapper">
        <div class="elementor-tab-title">Tab 1</div>
        <div class="elementor-tab-title">Tab 2</div>
      </div>
      <div class="elementor-tabs-content-wrapper">
        <div class="elementor-tab-content">Content 1</div>
        <div class="elementor-tab-content" style="display:none;">Content 2</div>
      </div>
    </div>
  </div>
</div>
```

### w:accordion
```html
<div class="elementor-widget elementor-widget-accordion">
  <div class="elementor-widget-container">
    <div class="elementor-accordion">
      <div class="elementor-accordion-item">
        <h3 class="elementor-accordion-title">
          <span class="elementor-accordion-icon"></span>
          <span>Accordion Item</span>
        </h3>
        <div class="elementor-accordion-body">
          <div class="elementor-accordion-body-title">Content</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:toggle
```html
<div class="elementor-widget elementor-widget-toggle">
  <div class="elementor-widget-container">
    <div class="elementor-toggle">
      <div class="elementor-toggle-item">
        <h3 class="elementor-toggle-title">Toggle Title</h3>
        <div class="elementor-toggle-content">Toggle content here</div>
      </div>
    </div>
  </div>
</div>
```

### w:alert
```html
<div class="elementor-widget elementor-widget-alert">
  <div class="elementor-widget-container">
    <div class="elementor-alert elementor-alert-type-info">
      <div class="elementor-alert-title">Alert Title</div>
      <div class="elementor-alert-description">Alert description</div>
    </div>
  </div>
</div>
```

### w:social-icons
```html
<div class="elementor-widget elementor-widget-social-icons">
  <div class="elementor-widget-container">
    <div class="elementor-social-icons-wrapper">
      <a href="#" class="elementor-social-icon elementor-social-icon-facebook">
        <i class="fab fa-facebook"></i>
      </a>
      <a href="#" class="elementor-social-icon elementor-social-icon-twitter">
        <i class="fab fa-twitter"></i>
      </a>
    </div>
  </div>
</div>
```

### w:soundcloud
```html
<div class="elementor-widget elementor-widget-soundcloud">
  <div class="elementor-widget-container">
    <iframe src="https://w.soundcloud.com/player/?url=..." 
            frameborder="no" 
            allow="autoplay">
    </iframe>
  </div>
</div>
```

### w:shortcode
```html
<div class="elementor-widget elementor-widget-shortcode">
  <div class="elementor-widget-container">
    [shortcode_name param="value"]
  </div>
</div>
```

### w:html
```html
<div class="elementor-widget elementor-widget-html">
  <div class="elementor-widget-container">
    <!-- Custom HTML content -->
    <div class="custom-html-content">
      Your HTML code here
    </div>
  </div>
</div>
```

### w:menu-anchor
```html
<div class="elementor-menu-anchor" id="menu-anchor-id"></div>
```

### w:sidebar
```html
<div class="elementor-widget elementor-widget-sidebar">
  <div class="elementor-widget-container">
    <aside class="elementor-sidebar">
      <!-- Sidebar content -->
    </aside>
  </div>
</div>
```

### w:read-more
```html
<div class="elementor-widget elementor-widget-read-more">
  <div class="elementor-widget-container">
    <a href="#" class="elementor-read-more">Read More</a>
  </div>
</div>
```

### w:image-carousel
```html
<div class="elementor-widget elementor-widget-image-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-image-carousel">
      <div class="elementor-carousel">
        <div class="elementor-slide">
          <img src="image1.jpg" alt="Slide 1">
        </div>
        <div class="elementor-slide">
          <img src="image2.jpg" alt="Slide 2">
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:basic-gallery
```html
<div class="elementor-widget elementor-widget-gallery">
  <div class="elementor-widget-container">
    <div class="elementor-gallery">
      <div class="elementor-gallery-item">
        <figure class="elementor-gallery-item__image">
          <img src="image1.jpg" alt="Gallery Image">
        </figure>
      </div>
    </div>
  </div>
</div>
```

### w:gallery
```html
<div class="elementor-widget elementor-widget-gallery">
  <div class="elementor-widget-container">
    <div class="elementor-gallery__titles-container"></div>
    <div class="elementor-gallery__container">
      <a href="image.jpg" class="elementor-gallery-item">
        <div class="elementor-gallery-item__image">
          <img src="thumbnail.jpg" alt="Gallery">
        </div>
        <div class="elementor-gallery-item__overlay">
          <div class="elementor-gallery-item__content">
            <div class="elementor-gallery-item__title">Title</div>
          </div>
        </div>
      </a>
    </div>
  </div>
</div>
```

### w:icon-list
```html
<div class="elementor-widget elementor-widget-icon-list">
  <div class="elementor-widget-container">
    <ul class="elementor-icon-list-items">
      <li class="elementor-icon-list-item">
        <span class="elementor-icon-list-icon"><i class="fas fa-check"></i></span>
        <span class="elementor-icon-list-text">List item</span>
      </li>
    </ul>
  </div>
</div>
```

### w:nav-menu
```html
<div class="elementor-widget elementor-widget-nav-menu">
  <div class="elementor-widget-container">
    <nav class="elementor-nav-menu">
      <ul class="elementor-nav-menu-list">
        <li class="elementor-item"><a href="#">Menu Item</a></li>
      </ul>
    </nav>
  </div>
</div>
```

### w:search-form
```html
<div class="elementor-widget elementor-widget-search-form">
  <div class="elementor-widget-container">
    <form class="elementor-search-form">
      <input type="search" placeholder="Search...">
      <button type="submit"><i class="fas fa-search"></i></button>
    </form>
  </div>
</div>
```

### w:google-maps
```html
<div class="elementor-widget elementor-widget-google_maps">
  <div class="elementor-widget-container">
    <div class="elementor-google-map">
      <div class="elementor-map" 
           data-lat="40.7128" 
           data-lng="-74.0060"
           style="height: 400px;">
      </div>
    </div>
  </div>
</div>
```

### w:testimonial
```html
<div class="elementor-widget elementor-widget-testimonial">
  <div class="elementor-widget-container">
    <div class="elementor-testimonial">
      <div class="elementor-testimonial-content">
        <p class="elementor-testimonial-text">Testimonial text</p>
      </div>
      <div class="elementor-testimonial-meta">
        <img src="avatar.jpg" class="elementor-testimonial-image" alt="Author">
        <div class="elementor-testimonial-meta-inner">
          <h3 class="elementor-testimonial-name">Author Name</h3>
          <div class="elementor-testimonial-title">Author Title</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:embed
```html
<div class="elementor-widget elementor-widget-embed">
  <div class="elementor-widget-container">
    <div class="elementor-embed-frame">
      <iframe src="embed-url" frameborder="0"></iframe>
    </div>
  </div>
</div>
```

### w:lottie
```html
<div class="elementor-widget elementor-widget-lottie">
  <div class="elementor-widget-container">
    <div class="elementor-lottie-animation" 
         data-animation-url="animation.json"
         style="height: 300px;">
    </div>
  </div>
</div>
```

### loop:grid
```html
<div class="elementor-widget elementor-widget-loop-grid">
  <div class="elementor-widget-container">
    <div class="elementor-loop-grid elementor-grid">
      <div class="elementor-grid-item">
        <!-- Loop item content -->
      </div>
    </div>
  </div>
</div>
```

---

## WIDGETS ELEMENTOR PRO

### w:form
```html
<div class="elementor-widget elementor-widget-form">
  <div class="elementor-widget-container">
    <form class="elementor-form" method="post">
      <div class="elementor-form-fields-wrapper">
        <div class="elementor-field-group">
          <label for="form-field-name" class="elementor-field-label">
            <span class="elementor-screen-only">Name</span>
          </label>
          <input type="text" name="form_fields[name]" id="form-field-name" class="elementor-field-textual elementor-size-md" placeholder="Name" required>
        </div>
      </div>
      <button type="submit" class="elementor-button">Submit</button>
    </form>
  </div>
</div>
```

### w:login
```html
<div class="elementor-widget elementor-widget-login">
  <div class="elementor-widget-container">
    <form class="elementor-login-form" method="post">
      <div class="elementor-login-form-field">
        <label>Username or Email</label>
        <input type="text" name="log" required>
      </div>
      <div class="elementor-login-form-field">
        <label>Password</label>
        <input type="password" name="pwd" required>
      </div>
      <button type="submit" class="elementor-button">Login</button>
    </form>
  </div>
</div>
```

### w:subscription
```html
<div class="elementor-widget elementor-widget-subscription">
  <div class="elementor-widget-container">
    <form class="elementor-subscription-form" method="post">
      <div class="elementor-subscription-content">
        <h3 class="elementor-subscription-title">Subscribe</h3>
        <input type="email" name="email" placeholder="Your email" required>
        <button type="submit" class="elementor-button">Subscribe</button>
      </div>
    </form>
  </div>
</div>
```

### w:call-to-action
```html
<div class="elementor-widget elementor-widget-call-to-action">
  <div class="elementor-widget-container">
    <div class="elementor-cta">
      <div class="elementor-cta__bg-overlay"></div>
      <div class="elementor-cta__content">
        <h2 class="elementor-cta__title">Call to Action</h2>
        <div class="elementor-cta__description">Description text</div>
        <a href="#" class="elementor-cta__button elementor-button">CTA Button</a>
      </div>
    </div>
  </div>
</div>
```

### media:carousel
```html
<div class="elementor-widget elementor-widget-media-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-carousel">
      <div class="elementor-slide">
        <div class="elementor-carousel-item">
          <img src="media1.jpg" alt="Media 1">
        </div>
      </div>
      <div class="elementor-slide">
        <div class="elementor-carousel-item">
          <img src="media2.jpg" alt="Media 2">
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:portfolio
```html
<div class="elementor-widget elementor-widget-portfolio">
  <div class="elementor-widget-container">
    <div class="elementor-portfolio">
      <div class="elementor-portfolio-item">
        <figure class="elementor-portfolio-item__image">
          <img src="portfolio.jpg" alt="Portfolio Item">
        </figure>
        <div class="elementor-portfolio-item__content">
          <h3 class="elementor-portfolio-item__title">Project Title</h3>
          <p class="elementor-portfolio-item__category">Category</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:gallery-pro
```html
<div class="elementor-widget elementor-widget-gallery-pro">
  <div class="elementor-widget-container">
    <div class="elementor-gallery-pro">
      <div class="elementor-gallery-pro-item">
        <img src="gallery-item.jpg" alt="Gallery Item">
        <div class="elementor-gallery-pro-overlay">
          <h3>Gallery Title</h3>
        </div>
      </div>
    </div>
  </div>
</div>
```

### slider:slides
```html
<div class="elementor-widget elementor-widget-slides">
  <div class="elementor-widget-container">
    <div class="elementor-slides-wrapper">
      <div class="elementor-slide">
        <div class="elementor-slide-background">
          <img src="slide1.jpg" alt="Slide 1">
        </div>
        <div class="elementor-slide-content">
          <h2 class="elementor-slide-heading">Slide 1</h2>
          <p class="elementor-slide-description">Slide description</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:slideshow
```html
<div class="elementor-widget elementor-widget-slideshow">
  <div class="elementor-widget-container">
    <div class="elementor-slideshow">
      <div class="elementor-slideshow-wrapper">
        <div class="elementor-slide-show-slide">
          <img src="slide.jpg" alt="Slide">
        </div>
      </div>
      <div class="elementor-slideshow-navigation"></div>
    </div>
  </div>
</div>
```

### w:flip-box
```html
<div class="elementor-widget elementor-widget-flip-box">
  <div class="elementor-widget-container">
    <div class="elementor-flip-box">
      <div class="elementor-flip-box-front">
        <div class="elementor-flip-box-front-inner">
          <h3>Front Title</h3>
        </div>
      </div>
      <div class="elementor-flip-box-back">
        <div class="elementor-flip-box-back-inner">
          <h3>Back Title</h3>
          <p>Back content</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:animated-headline
```html
<div class="elementor-widget elementor-widget-animated-headline">
  <div class="elementor-widget-container">
    <h2 class="elementor-headline">
      <span class="elementor-headline-plain-text">Before</span>
      <span class="elementor-headline-dynamic-wrapper">
        <span class="elementor-headline-text">Animated Text</span>
      </span>
    </h2>
  </div>
</div>
```

### w:post-navigation
```html
<div class="elementor-widget elementor-widget-post-navigation">
  <div class="elementor-widget-container">
    <nav class="elementor-post-navigation">
      <div class="elementor-post-nav-prev">
        <a href="#">Previous Post</a>
      </div>
      <div class="elementor-post-nav-next">
        <a href="#">Next Post</a>
      </div>
    </nav>
  </div>
</div>
```

### w:share-buttons
```html
<div class="elementor-widget elementor-widget-share-buttons">
  <div class="elementor-widget-container">
    <div class="elementor-share-buttons">
      <a href="#" class="elementor-share-btn facebook">
        <i class="fab fa-facebook"></i>
      </a>
      <a href="#" class="elementor-share-btn twitter">
        <i class="fab fa-twitter"></i>
      </a>
    </div>
  </div>
</div>
```

### w:table-of-contents
```html
<div class="elementor-widget elementor-widget-table-of-contents">
  <div class="elementor-widget-container">
    <div class="elementor-toc">
      <h2 class="elementor-toc-title">Table of Contents</h2>
      <ul class="elementor-toc-list">
        <li><a href="#heading-1">Heading 1</a></li>
        <li><a href="#heading-2">Heading 2</a></li>
      </ul>
    </div>
  </div>
</div>
```

### w:countdown
```html
<div class="elementor-widget elementor-widget-countdown">
  <div class="elementor-widget-container">
    <div class="elementor-countdown">
      <div class="elementor-countdown-item days">
        <span class="elementor-countdown-digit">0</span>
        <span class="elementor-countdown-label">Days</span>
      </div>
      <div class="elementor-countdown-item hours">
        <span class="elementor-countdown-digit">0</span>
        <span class="elementor-countdown-label">Hours</span>
      </div>
    </div>
  </div>
</div>
```

### w:blockquote
```html
<div class="elementor-widget elementor-widget-blockquote">
  <div class="elementor-widget-container">
    <blockquote class="elementor-blockquote">
      <p class="elementor-blockquote-content">Blockquote text</p>
      <footer class="elementor-blockquote-footer">
        <cite class="elementor-blockquote-author">Author Name</cite>
      </footer>
    </blockquote>
  </div>
</div>
```

### w:testimonial-carousel
```html
<div class="elementor-widget elementor-widget-testimonial-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-testimonials-carousel elementor-carousel">
      <div class="elementor-slide">
        <div class="elementor-testimonial">
          <p class="elementor-testimonial-text">Testimonial</p>
          <footer class="elementor-testimonial-meta">
            <cite class="elementor-testimonial-name">Author</cite>
          </footer>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:review-box
```html
<div class="elementor-widget elementor-widget-review-box">
  <div class="elementor-widget-container">
    <div class="elementor-review">
      <div class="elementor-review-header">
        <h3 class="elementor-review-title">Review Title</h3>
        <div class="elementor-review-rating">★★★★☆</div>
      </div>
      <div class="elementor-review-content">
        <p>Review content here</p>
      </div>
    </div>
  </div>
</div>
```

### w:hotspots
```html
<div class="elementor-widget elementor-widget-hotspots">
  <div class="elementor-widget-container">
    <div class="elementor-hotspots-container">
      <img src="image.jpg" alt="Hotspot Image">
      <div class="elementor-hotspot" data-x="50" data-y="50">
        <span class="elementor-hotspot-indicator"></span>
        <div class="elementor-hotspot-tooltip">Hotspot content</div>
      </div>
    </div>
  </div>
</div>
```

### w:sitemap
```html
<div class="elementor-widget elementor-widget-sitemap">
  <div class="elementor-widget-container">
    <div class="elementor-sitemap">
      <ul class="elementor-sitemap-list">
        <li><a href="#">Page Link</a></li>
      </ul>
    </div>
  </div>
</div>
```

### w:author-box
```html
<div class="elementor-widget elementor-widget-author-box">
  <div class="elementor-widget-container">
    <div class="elementor-author-box">
      <img src="author-avatar.jpg" class="elementor-author-box-avatar" alt="Author">
      <div class="elementor-author-box-content">
        <h3 class="elementor-author-box-name">Author Name</h3>
        <p class="elementor-author-box-bio">Author bio text</p>
      </div>
    </div>
  </div>
</div>
```

### w:price-table
```html
<div class="elementor-widget elementor-widget-price-table">
  <div class="elementor-widget-container">
    <div class="elementor-price-table">
      <div class="elementor-price-table-header">
        <h3 class="elementor-price-table-title">Plan Name</h3>
        <span class="elementor-price-table-currency">$</span>
        <span class="elementor-price-table-integer-part">99</span>
        <span class="elementor-price-table-fractional-part">99</span>
      </div>
      <ul class="elementor-price-table-features">
        <li class="elementor-price-table-feature">
          <span>Feature 1</span>
        </li>
      </ul>
      <div class="elementor-price-table-footer">
        <a href="#" class="elementor-button">Buy Now</a>
      </div>
    </div>
  </div>
</div>
```

### w:price-list
```html
<div class="elementor-widget elementor-widget-price-list">
  <div class="elementor-widget-container">
    <div class="elementor-price-list">
      <div class="elementor-price-list-item">
        <h4 class="elementor-price-list-heading">Item Title</h4>
        <span class="elementor-price-list-separator"></span>
        <span class="elementor-price-list-price">$10</span>
      </div>
    </div>
  </div>
</div>
```

### w:progress-tracker
```html
<div class="elementor-widget elementor-widget-progress-tracker">
  <div class="elementor-widget-container">
    <div class="elementor-progress-tracker">
      <div class="elementor-progress-tracker-item">
        <div class="elementor-progress-tracker-step">1</div>
        <div class="elementor-progress-tracker-label">Step 1</div>
      </div>
    </div>
  </div>
</div>
```

### w:animated-text
```html
<div class="elementor-widget elementor-widget-animated-text">
  <div class="elementor-widget-container">
    <div class="elementor-animated-text">
      <span class="elementor-animated-text-word">Animated</span>
      <span class="elementor-animated-text-word">Text</span>
    </div>
  </div>
</div>
```

### w:nav-menu-pro
```html
<div class="elementor-widget elementor-widget-nav-menu">
  <div class="elementor-widget-container">
    <nav class="elementor-nav-menu-pro">
      <ul class="elementor-nav-menu-pro-list">
        <li class="elementor-item">
          <a href="#">Menu Item</a>
          <ul class="elementor-submenu">
            <li><a href="#">Submenu Item</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </div>
</div>
```

### w:breadcrumb
```html
<div class="elementor-widget elementor-widget-breadcrumb">
  <div class="elementor-widget-container">
    <div class="elementor-breadcrumb">
      <span class="elementor-breadcrumb-item">
        <a href="#">Home</a>
      </span>
      <span class="elementor-breadcrumb-separator">›</span>
      <span class="elementor-breadcrumb-item">
        Current Page
      </span>
    </div>
  </div>
</div>
```

### w:facebook-button
```html
<div class="elementor-widget elementor-widget-facebook-button">
  <div class="elementor-widget-container">
    <a href="#" class="elementor-facebook-button fb-button">
      <i class="fab fa-facebook"></i> Like
    </a>
  </div>
</div>
```

### w:facebook-comments
```html
<div class="elementor-widget elementor-widget-facebook-comments">
  <div class="elementor-widget-container">
    <div class="fb-comments" data-href="page-url" data-numposts="5"></div>
  </div>
</div>
```

### w:facebook-embed
```html
<div class="elementor-widget elementor-widget-facebook-embed">
  <div class="elementor-widget-container">
    <div class="fb-post" data-href="post-url"></div>
  </div>
</div>
```

### w:facebook-page
```html
<div class="elementor-widget elementor-widget-facebook-page">
  <div class="elementor-widget-container">
    <div class="fb-page" data-href="page-url"></div>
  </div>
</div>
```

### loop:builder
```html
<div class="elementor-widget elementor-widget-loop-builder">
  <div class="elementor-widget-container">
    <div class="elementor-loop-builder">
      <!-- Loop builder content -->
    </div>
  </div>
</div>
```

### loop:grid-advanced
```html
<div class="elementor-widget elementor-widget-loop-grid-advanced">
  <div class="elementor-widget-container">
    <div class="elementor-loop-grid-advanced elementor-grid">
      <div class="elementor-grid-item">
        <!-- Advanced grid item -->
      </div>
    </div>
  </div>
</div>
```

### loop:carousel
```html
<div class="elementor-widget elementor-widget-loop-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-loop-carousel elementor-carousel">
      <div class="elementor-slide">
        <!-- Carousel item -->
      </div>
    </div>
  </div>
</div>
```

### w:post-excerpt
```html
<div class="elementor-widget elementor-widget-post-excerpt">
  <div class="elementor-widget-container">
    <div class="elementor-post-excerpt">
      <p>Post excerpt text here...</p>
    </div>
  </div>
</div>
```

### w:post-content
```html
<div class="elementor-widget elementor-widget-post-content">
  <div class="elementor-widget-container">
    <div class="elementor-post-content">
      <!-- Full post content renders here -->
    </div>
  </div>
</div>
```

### w:post-title
```html
<div class="elementor-widget elementor-widget-post-title">
  <div class="elementor-widget-container">
    <h1 class="elementor-post-title">Post Title</h1>
  </div>
</div>
```

### w:post-info
```html
<div class="elementor-widget elementor-widget-post-info">
  <div class="elementor-widget-container">
    <div class="elementor-post-info">
      <span class="elementor-post-info-author">By Author Name</span>
      <span class="elementor-post-info-date">Date Published</span>
    </div>
  </div>
</div>
```

### w:post-featured-image
```html
<div class="elementor-widget elementor-widget-post-featured-image">
  <div class="elementor-widget-container">
    <div class="elementor-post-featured-image">
      <img src="featured-image.jpg" alt="Featured Image">
    </div>
  </div>
</div>
```

### w:post-author
```html
<div class="elementor-widget elementor-widget-post-author">
  <div class="elementor-widget-container">
    <div class="elementor-post-author">
      <img src="author.jpg" alt="Author">
      <h4>Author Name</h4>
    </div>
  </div>
</div>
```

### w:post-date
```html
<div class="elementor-widget elementor-widget-post-date">
  <div class="elementor-widget-container">
    <div class="elementor-post-date">
      Published on: <time>Date</time>
    </div>
  </div>
</div>
```

### w:post-terms
```html
<div class="elementor-widget elementor-widget-post-terms">
  <div class="elementor-widget-container">
    <div class="elementor-post-terms">
      <a href="#">Category</a>, <a href="#">Tag</a>
    </div>
  </div>
</div>
```

### w:archive-title
```html
<div class="elementor-widget elementor-widget-archive-title">
  <div class="elementor-widget-container">
    <h1 class="elementor-archive-title">Archive Title</h1>
  </div>
</div>
```

### w:archive-description
```html
<div class="elementor-widget elementor-widget-archive-description">
  <div class="elementor-widget-container">
    <div class="elementor-archive-description">
      <p>Archive description here</p>
    </div>
  </div>
</div>
```

### w:site-logo
```html
<div class="elementor-widget elementor-widget-site-logo">
  <div class="elementor-widget-container">
    <div class="elementor-site-logo">
      <a href="/">
        <img src="logo.png" alt="Logo">
      </a>
    </div>
  </div>
</div>
```

### w:site-title
```html
<div class="elementor-widget elementor-widget-site-title">
  <div class="elementor-widget-container">
    <h1 class="elementor-site-title">
      <a href="/">Site Title</a>
    </h1>
  </div>
</div>
```

### w:site-tagline
```html
<div class="elementor-widget elementor-widget-site-tagline">
  <div class="elementor-widget-container">
    <p class="elementor-site-tagline">Site tagline here</p>
  </div>
</div>
```

### w:search-results
```html
<div class="elementor-widget elementor-widget-search-results">
  <div class="elementor-widget-container">
    <div class="elementor-search-results">
      <!-- Search results render here -->
    </div>
  </div>
</div>
```

### w:global-widget
```html
<div class="elementor-widget elementor-widget-global-widget" data-widget-id="123">
  <div class="elementor-widget-container">
    <!-- Global widget content -->
  </div>
</div>
```

### w:video-playlist
```html
<div class="elementor-widget elementor-widget-video-playlist">
  <div class="elementor-widget-container">
    <div class="elementor-video-playlist">
      <div class="elementor-playlist-item">
        <iframe src="video-url"></iframe>
      </div>
    </div>
  </div>
</div>
```

### w:video-gallery
```html
<div class="elementor-widget elementor-widget-video-gallery">
  <div class="elementor-widget-container">
    <div class="elementor-video-gallery">
      <div class="elementor-video-gallery-item">
        <iframe src="video-url"></iframe>
      </div>
    </div>
  </div>
</div>
```

---

## WIDGETS WOOCOMMERCE

### woo:product-title
```html
<div class="elementor-widget elementor-widget-wc-product-title">
  <div class="elementor-widget-container">
    <h1 class="product_title entry-title">Product Name</h1>
  </div>
</div>
```

### woo:product-image
```html
<div class="elementor-widget elementor-widget-wc-product-image">
  <div class="elementor-widget-container">
    <div class="product-images">
      <figure class="woocommerce-product-gallery">
        <img src="product.jpg" alt="Product">
      </figure>
    </div>
  </div>
</div>
```

### woo:product-price
```html
<div class="elementor-widget elementor-widget-wc-product-price">
  <div class="elementor-widget-container">
    <div class="product_price">
      <span class="woocommerce-Price-amount amount">
        <bdi><span class="woocommerce-Price-currencySymbol">$</span>99.99</bdi>
      </span>
    </div>
  </div>
</div>
```

### woo:product-add-to-cart
```html
<div class="elementor-widget elementor-widget-wc-product-add-to-cart">
  <div class="elementor-widget-container">
    <form class="cart" method="post" enctype="multipart/form-data">
      <div class="quantity">
        <input type="number" value="1" min="1">
      </div>
      <button type="submit" class="single_add_to_cart_button button alt">Add to Cart</button>
    </form>
  </div>
</div>
```

### woo:product-data-tabs
```html
<div class="elementor-widget elementor-widget-wc-product-data-tabs">
  <div class="elementor-widget-container">
    <div class="woocommerce-tabs">
      <ul class="tabs">
        <li><a href="#tab-description">Description</a></li>
        <li><a href="#tab-reviews">Reviews</a></li>
      </ul>
      <div id="tab-description" class="tab-content">Description content</div>
    </div>
  </div>
</div>
```

### woo:product-excerpt
```html
<div class="elementor-widget elementor-widget-wc-product-excerpt">
  <div class="elementor-widget-container">
    <div class="woocommerce-product-details__short-description">
      <p>Product short description</p>
    </div>
  </div>
</div>
```

### woo:product-rating
```html
<div class="elementor-widget elementor-widget-wc-product-rating">
  <div class="elementor-widget-container">
    <div class="woocommerce-product-rating">
      <div class="star-rating" role="img">
        <span style="width:80%;">Rated 4 out of 5</span>
      </div>
    </div>
  </div>
</div>
```

### woo:product-stock
```html
<div class="elementor-widget elementor-widget-wc-product-stock">
  <div class="elementor-widget-container">
    <p class="stock in-stock">In stock</p>
  </div>
</div>
```

### woo:product-meta
```html
<div class="elementor-widget elementor-widget-wc-product-meta">
  <div class="elementor-widget-container">
    <div class="product_meta">
      <span class="sku_wrapper">SKU: <span class="sku">12345</span></span>
      <span class="posted_in">Category: <a href="#">Electronics</a></span>
    </div>
  </div>
</div>
```

### woo:product-additional-information
```html
<div class="elementor-widget elementor-widget-wc-product-additional-information">
  <div class="elementor-widget-container">
    <table class="woocommerce-product-attributes">
      <tr class="woocommerce-product-attributes-item">
        <th>Attribute</th>
        <td>Value</td>
      </tr>
    </table>
  </div>
</div>
```

### woo:product-short-description
```html
<div class="elementor-widget elementor-widget-wc-product-short-description">
  <div class="elementor-widget-container">
    <div class="woocommerce-product-details__short-description">
      <p>Short description here</p>
    </div>
  </div>
</div>
```

### woo:product-related
```html
<div class="elementor-widget elementor-widget-wc-product-related">
  <div class="elementor-widget-container">
    <section class="related products">
      <h2>Related Products</h2>
      <div class="products">
        <div class="product">
          <img src="product.jpg" alt="Related Product">
        </div>
      </div>
    </section>
  </div>
</div>
```

### woo:product-upsells
```html
<div class="elementor-widget elementor-widget-wc-product-upsells">
  <div class="elementor-widget-container">
    <section class="up-sells upsells products">
      <h2>You might also like…</h2>
      <div class="products">
        <div class="product">
          <img src="upsell.jpg" alt="Upsell Product">
        </div>
      </div>
    </section>
  </div>
</div>
```

### woo:product-tabs
```html
<div class="elementor-widget elementor-widget-wc-product-tabs">
  <div class="elementor-widget-container">
    <div class="woocommerce-tabs">
      <ul class="tabs wc-tabs">
        <li><a href="#tab-description">Description</a></li>
      </ul>
    </div>
  </div>
</div>
```

### woo:product-breadcrumb
```html
<div class="elementor-widget elementor-widget-wc-product-breadcrumb">
  <div class="elementor-widget-container">
    <nav class="woocommerce-breadcrumb">
      <a href="#">Shop</a> › Product
    </nav>
  </div>
</div>
```

### woo:product-gallery
```html
<div class="elementor-widget elementor-widget-wc-product-gallery">
  <div class="elementor-widget-container">
    <div class="product-gallery-wrapper">
      <figure class="woocommerce-product-gallery">
        <img src="gallery.jpg" alt="Product Gallery">
      </figure>
    </div>
  </div>
</div>
```

### woo:products
```html
<div class="elementor-widget elementor-widget-wc-products">
  <div class="elementor-widget-container">
    <div class="woocommerce columns-4">
      <ul class="products">
        <li class="product">
          <img src="product.jpg" alt="Product">
          <h2>Product Name</h2>
          <span class="price">$99.99</span>
          <a href="#" class="button">Read more</a>
        </li>
      </ul>
    </div>
  </div>
</div>
```

### woo:product-grid
```html
<div class="elementor-widget elementor-widget-wc-product-grid">
  <div class="elementor-widget-container">
    <div class="woocommerce-product-grid elementor-grid">
      <div class="product elementor-grid-item">
        <!-- Product item -->
      </div>
    </div>
  </div>
</div>
```

### woo:product-carousel
```html
<div class="elementor-widget elementor-widget-wc-product-carousel">
  <div class="elementor-widget-container">
    <div class="woocommerce-product-carousel elementor-carousel">
      <div class="product elementor-slide">
        <!-- Carousel product -->
      </div>
    </div>
  </div>
</div>
```

### woo:product-loop-item
```html
<div class="elementor-widget elementor-widget-wc-product-loop-item">
  <div class="elementor-widget-container">
    <div class="product-loop-item">
      <!-- Product loop item content -->
    </div>
  </div>
</div>
```

### woo:loop-product-title
```html
<div class="elementor-widget elementor-widget-wc-loop-product-title">
  <div class="elementor-widget-container">
    <h2><a href="#">Product Title</a></h2>
  </div>
</div>
```

### woo:loop-product-price
```html
<div class="elementor-widget elementor-widget-wc-loop-product-price">
  <div class="elementor-widget-container">
    <span class="price">$99.99</span>
  </div>
</div>
```

### woo:loop-product-rating
```html
<div class="elementor-widget elementor-widget-wc-loop-product-rating">
  <div class="elementor-widget-container">
    <div class="star-rating">
      <span style="width:80%;">★★★★☆</span>
    </div>
  </div>
</div>
```

### woo:loop-product-image
```html
<div class="elementor-widget elementor-widget-wc-loop-product-image">
  <div class="elementor-widget-container">
    <img src="product-thumbnail.jpg" alt="Product Thumbnail">
  </div>
</div>
```

### woo:loop-product-button
```html
<div class="elementor-widget elementor-widget-wc-loop-product-button">
  <div class="elementor-widget-container">
    <a href="#" class="button">Add to Cart</a>
  </div>
</div>
```

### woo:loop-product-meta
```html
<div class="elementor-widget elementor-widget-wc-loop-product-meta">
  <div class="elementor-widget-container">
    <div class="product-meta">SKU: 123, Category: Electronics</div>
  </div>
</div>
```

### woo:cart
```html
<div class="elementor-widget elementor-widget-wc-cart">
  <div class="elementor-widget-container">
    <div class="woocommerce">
      <table class="shop_table cart">
        <tr>
          <td class="product-name">Product</td>
          <td class="product-price">$99.99</td>
        </tr>
      </table>
    </div>
  </div>
</div>
```

### woo:checkout
```html
<div class="elementor-widget elementor-widget-wc-checkout">
  <div class="elementor-widget-container">
    <div class="woocommerce">
      <form class="checkout" method="post">
        <div class="col-1">
          <h3>Billing details</h3>
          <div class="woocommerce-billing-fields">
            <!-- Billing form fields -->
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
```

### woo:my-account
```html
<div class="elementor-widget elementor-widget-wc-my-account">
  <div class="elementor-widget-container">
    <div class="woocommerce-account">
      <nav class="woocommerce-MyAccount-navigation">
        <ul>
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Orders</a></li>
        </ul>
      </nav>
    </div>
  </div>
</div>
```

### woo:purchase-summary
```html
<div class="elementor-widget elementor-widget-wc-purchase-summary">
  <div class="elementor-widget-container">
    <div class="woocommerce-purchase-summary">
      <h3>Order Summary</h3>
      <p>Subtotal: $99.99</p>
      <p>Total: $99.99</p>
    </div>
  </div>
</div>
```

### woo:order-tracking
```html
<div class="elementor-widget elementor-widget-wc-order-tracking">
  <div class="elementor-widget-container">
    <form class="woocommerce-order-tracking" method="post">
      <p>Enter your order number to track your shipment.</p>
      <input type="text" name="order" placeholder="Order #">
      <button type="submit" class="button">Track</button>
    </form>
  </div>
</div>
```

---

## LOOP BUILDER WIDGETS

### loop:grid
```html
<div class="elementor-widget elementor-widget-loop-grid">
  <div class="elementor-widget-container">
    <div class="elementor-loop-grid elementor-grid">
      <div class="elementor-grid-item">
        <!-- Loop item -->
      </div>
    </div>
  </div>
</div>
```

### loop:carousel
```html
<div class="elementor-widget elementor-widget-loop-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-loop-carousel elementor-carousel">
      <div class="elementor-slide">
        <!-- Carousel loop item -->
      </div>
    </div>
  </div>
</div>
```

### loop:item
```html
<div class="elementor-widget elementor-widget-loop-item">
  <div class="elementor-widget-container">
    <div class="loop-item">
      <!-- Loop item content container -->
    </div>
  </div>
</div>
```

### loop:image
```html
<div class="elementor-widget elementor-widget-loop-image">
  <div class="elementor-widget-container">
    <figure class="loop-item-image">
      <img src="image.jpg" alt="Item Image">
    </figure>
  </div>
</div>
```

### loop:title
```html
<div class="elementor-widget elementor-widget-loop-title">
  <div class="elementor-widget-container">
    <h2 class="loop-item-title"><a href="#">Item Title</a></h2>
  </div>
</div>
```

### loop:meta
```html
<div class="elementor-widget elementor-widget-loop-meta">
  <div class="elementor-widget-container">
    <div class="loop-item-meta">
      <span class="loop-meta-author">By Author</span>
      <span class="loop-meta-date">Date</span>
    </div>
  </div>
</div>
```

### loop:terms
```html
<div class="elementor-widget elementor-widget-loop-terms">
  <div class="elementor-widget-container">
    <div class="loop-item-terms">
      <a href="#">Category</a>, <a href="#">Tag</a>
    </div>
  </div>
</div>
```

### loop:rating
```html
<div class="elementor-widget elementor-widget-loop-rating">
  <div class="elementor-widget-container">
    <div class="loop-item-rating">
      <div class="star-rating">★★★★☆</div>
    </div>
  </div>
</div>
```

### loop:price
```html
<div class="elementor-widget elementor-widget-loop-price">
  <div class="elementor-widget-container">
    <span class="loop-item-price">$99.99</span>
  </div>
</div>
```

### loop:add-to-cart
```html
<div class="elementor-widget elementor-widget-loop-add-to-cart">
  <div class="elementor-widget-container">
    <a href="#" class="loop-item-add-to-cart button">Add to Cart</a>
  </div>
</div>
```

### loop:read-more
```html
<div class="elementor-widget elementor-widget-loop-read-more">
  <div class="elementor-widget-container">
    <a href="#" class="loop-item-read-more button">Read More</a>
  </div>
</div>
```

### loop:featured-image
```html
<div class="elementor-widget elementor-widget-loop-featured-image">
  <div class="elementor-widget-container">
    <img src="featured.jpg" class="loop-featured-image" alt="Featured Image">
  </div>
</div>
```

---

## CARROSSÉIS

### w:image-carousel
```html
<div class="elementor-widget elementor-widget-image-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-image-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <img src="image1.jpg" alt="Slide 1">
        </div>
        <div class="swiper-slide">
          <img src="image2.jpg" alt="Slide 2">
        </div>
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-button-prev"></div>
      <div class="swiper-button-next"></div>
    </div>
  </div>
</div>
```

### media:carousel
```html
<div class="elementor-widget elementor-widget-media-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-media-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <img src="media1.jpg" alt="Media 1">
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:testimonial-carousel
```html
<div class="elementor-widget elementor-widget-testimonial-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-testimonials-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <div class="elementor-testimonial">
            <p class="elementor-testimonial-text">Testimonial text</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:review-carousel
```html
<div class="elementor-widget elementor-widget-review-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-review-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <div class="elementor-review-item">★★★★★ Review</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### slider:slides
```html
<div class="elementor-widget elementor-widget-slides">
  <div class="elementor-widget-container">
    <div class="elementor-slides-wrapper swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide elementor-slide">
          <div class="elementor-slide-content">Slide content</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### slider:slider
```html
<div class="elementor-widget elementor-widget-slider">
  <div class="elementor-widget-container">
    <div class="elementor-slider swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">Slider item</div>
      </div>
    </div>
  </div>
</div>
```

### loop:carousel
```html
<div class="elementor-widget elementor-widget-loop-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-loop-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <!-- Loop carousel item -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### woo:product-carousel
```html
<div class="elementor-widget elementor-widget-wc-product-carousel">
  <div class="elementor-widget-container">
    <div class="woocommerce-product-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide product">
          <img src="product.jpg" alt="Product">
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:posts-carousel
```html
<div class="elementor-widget elementor-widget-posts-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-posts-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide post">
          <h3>Post Title</h3>
        </div>
      </div>
    </div>
  </div>
</div>
```

### w:gallery-carousel
```html
<div class="elementor-widget elementor-widget-gallery-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-gallery-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <img src="gallery.jpg" alt="Gallery">
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## WIDGETS EXPERIMENTAIS

### w:nested-tabs
```html
<div class="elementor-widget elementor-widget-nested-tabs">
  <div class="elementor-widget-container">
    <div class="elementor-nested-tabs">
      <div class="elementor-tabs-wrapper">
        <div class="elementor-tab-title">Nested Tab</div>
      </div>
    </div>
  </div>
</div>
```

### w:mega-menu
```html
<div class="elementor-widget elementor-widget-mega-menu">
  <div class="elementor-widget-container">
    <nav class="elementor-mega-menu">
      <ul>
        <li>
          <a href="#">Menu</a>
          <div class="mega-menu-panel">Mega menu content</div>
        </li>
      </ul>
    </nav>
  </div>
</div>
```

### w:scroll-snap
```html
<div class="elementor-widget elementor-widget-scroll-snap">
  <div class="elementor-widget-container elementor-scroll-snap">
    <section>Section 1</section>
    <section>Section 2</section>
  </div>
</div>
```

### w:motion-effects
```html
<div class="elementor-widget elementor-widget-motion-effects" data-motion-effect="parallax">
  <div class="elementor-widget-container">
    <div class="motion-effect-content">
      Content with motion effects
    </div>
  </div>
</div>
```

### w:background-slideshow
```html
<div class="elementor-widget elementor-widget-background-slideshow" data-slideshow-effect="fade">
  <div class="elementor-widget-container">
    <div class="elementor-slideshow-background">
      <img src="slide1.jpg" alt="Slide 1">
      <img src="slide2.jpg" alt="Slide 2">
    </div>
    <div class="elementor-slideshow-content">Content</div>
  </div>
</div>
```

### w:css-transform
```html
<div class="elementor-widget elementor-widget-css-transform" style="transform: skewX(-10deg);">
  <div class="elementor-widget-container">
    Transformed content
  </div>
</div>
```

### w:custom-position
```html
<div class="elementor-widget elementor-widget-custom-position" style="position: absolute; top: 0; left: 0;">
  <div class="elementor-widget-container">
    Custom positioned content
  </div>
</div>
```

### w:dynamic-tags
```html
<div class="elementor-widget elementor-widget-dynamic-tags">
  <div class="elementor-widget-container">
    <div class="dynamic-tags-content">
      [elementor-tag id="post_title"]
    </div>
  </div>
</div>
```

### w:ajax-pagination
```html
<div class="elementor-widget elementor-widget-ajax-pagination">
  <div class="elementor-widget-container">
    <nav class="elementor-pagination">
      <a href="#" class="page-numbers">1</a>
      <a href="#" class="page-numbers">2</a>
      <span class="page-numbers current">3</span>
    </nav>
  </div>
</div>
```

### loop:pagination
```html
<div class="elementor-widget elementor-widget-loop-pagination">
  <div class="elementor-widget-container">
    <div class="elementor-loop-pagination">
      <a href="#" class="pagination-link">Previous</a>
      <span class="pagination-number">1</span>
      <a href="#" class="pagination-link">Next</a>
    </div>
  </div>
</div>
```

### w:aspect-ratio-container
```html
<div class="elementor-widget elementor-widget-aspect-ratio-container" style="aspect-ratio: 16/9;">
  <div class="elementor-widget-container">
    <div class="aspect-ratio-content">
      Content maintaining aspect ratio
    </div>
  </div>
</div>
```

---

## WIDGETS WORDPRESS

### w:wp-search
```html
<div class="elementor-widget elementor-widget-wp-search">
  <div class="elementor-widget-container">
    <aside class="widget widget_search">
      <form class="searchform" method="get">
        <input type="search" name="s" placeholder="Search...">
        <button type="submit">Search</button>
      </form>
    </aside>
  </div>
</div>
```

### w:wp-recent-posts
```html
<div class="elementor-widget elementor-widget-wp-recent-posts">
  <div class="elementor-widget-container">
    <aside class="widget widget_recent_entries">
      <h3>Recent Posts</h3>
      <ul>
        <li><a href="#">Post Title</a></li>
      </ul>
    </aside>
  </div>
</div>
```

### w:wp-recent-comments
```html
<div class="elementor-widget elementor-widget-wp-recent-comments">
  <div class="elementor-widget-container">
    <aside class="widget widget_recent_comments">
      <h3>Recent Comments</h3>
      <ul id="recent-comments">
        <li>Comment text</li>
      </ul>
    </aside>
  </div>
</div>
```

### w:wp-archives
```html
<div class="elementor-widget elementor-widget-wp-archives">
  <div class="elementor-widget-container">
    <aside class="widget widget_archive">
      <h3>Archives</h3>
      <ul>
        <li><a href="#">January 2025</a></li>
      </ul>
    </aside>
  </div>
</div>
```

### w:wp-categories
```html
<div class="elementor-widget elementor-widget-wp-categories">
  <div class="elementor-widget-container">
    <aside class="widget widget_categories">
      <h3>Categories</h3>
      <ul>
        <li><a href="#">Category Name</a></li>
      </ul>
    </aside>
  </div>
</div>
```

### w:wp-calendar
```html
<div class="elementor-widget elementor-widget-wp-calendar">
  <div class="elementor-widget-container">
    <aside class="widget widget_calendar">
      <div id="calendar_wrap">
        <table id="wp-calendar">
          <tr><th>S</th><th>M</th><th>T</th></tr>
        </table>
      </div>
    </aside>
  </div>
</div>
```

### w:wp-tag-cloud
```html
<div class="elementor-widget elementor-widget-wp-tag-cloud">
  <div class="elementor-widget-container">
    <aside class="widget widget_tag_cloud">
      <h3>Tags</h3>
      <div class="tagcloud">
        <a href="#">tag1</a>
        <a href="#">tag2</a>
      </div>
    </aside>
  </div>
</div>
```

### w:wp-custom-menu
```html
<div class="elementor-widget elementor-widget-wp-custom-menu">
  <div class="elementor-widget-container">
    <nav class="elementor-wp-menu">
      <ul class="wp-menu-list">
        <li><a href="#">Menu Item</a></li>
      </ul>
    </nav>
  </div>
</div>
```

---

## ESTRUTURA PADRÃO DE WRAPPER

Todos os widgets seguem essa estrutura base:

```html
<div class="elementor-widget elementor-widget-[tipo]">
  <div class="elementor-widget-container">
    <!-- Widget content here -->
  </div>
</div>
```

---

## CLASSES IMPORTANTES DE ELEMENTOR

- `.elementor-widget` - Container raiz do widget
- `.elementor-widget-container` - Container interno de conteúdo
- `.elementor-button` - Classe para botões
- `.elementor-carousel` - Classe para carrosséis (usa Swiper.js)
- `.elementor-grid` - Classe para layouts em grid
- `.elementor-tabs-wrapper` - Wrapper para tabs
- `.elementor-accordion` - Classe para accordion
- `.elementor-form` - Classe para formulários
- `.elementor-post-*` - Classes para widgets de posts

---

## ATRIBUTOS DATA IMPORTANTES

- `data-animation-url` - URL da animação Lottie
- `data-lat` / `data-lng` - Coordenadas do Google Maps
- `data-to-value` - Valor final do counter
- `data-widget-id` - ID do widget global
- `data-motion-effect` - Tipo de efeito de movimento
- `data-slideshow-effect` - Tipo de efeito do slideshow

Este documento serve como referência completa para mapeamento de componentes Figma → Elementor WordPress.

