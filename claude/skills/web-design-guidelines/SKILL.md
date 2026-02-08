---
name: web-design-guidelines
description: This skill should be used when the user asks about "web design", "UI design", "UX best practices", "responsive design", "accessibility", "color schemes", "typography", "layout patterns", "design system", "component design", or mentions "styling", "CSS", "Tailwind", "design tokens". Provides guidance for modern web design best practices.
---

# Web Design Guidelines

Comprehensive guidelines for creating modern, accessible, and performant web interfaces.

## Design Principles

1. **Clarity**: Make interfaces immediately understandable
2. **Consistency**: Use patterns that users recognize
3. **Efficiency**: Minimize steps to complete tasks
4. **Accessibility**: Design for all users
5. **Responsiveness**: Work across all devices

## Layout Patterns

### Container Widths

```css
/* Common breakpoints */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Spacing System

```css
/* 4px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

## Typography

### Font Scale

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Line Heights

- **Headings**: 1.2 - 1.3
- **Body text**: 1.5 - 1.7
- **UI elements**: 1.25

## Color Guidelines

### Color Palette Structure

```css
/* Primary colors */
--primary-50: /* lightest */
--primary-100:
--primary-500: /* base */
--primary-900: /* darkest */

/* Semantic colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### Contrast Requirements

- **Normal text**: 4.5:1 minimum (WCAG AA)
- **Large text**: 3:1 minimum (18px+ or 14px+ bold)
- **UI components**: 3:1 minimum

## Component Patterns

### Buttons

```tsx
// Primary action
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Primary
</button>

// Secondary action
<button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
  Secondary
</button>
```

### Form Inputs

```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  aria-describedby="input-description"
/>
```

### Cards

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-gray-600 mt-2">Card content goes here.</p>
</div>
```

## Responsive Design

### Mobile-First Approach

```css
/* Base styles for mobile */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

### Touch Targets

- **Minimum size**: 44x44px for touch targets
- **Spacing**: At least 8px between interactive elements

## Accessibility Checklist

- [ ] All images have descriptive alt text
- [ ] Form inputs have associated labels
- [ ] Color is not the only indicator of meaning
- [ ] Focus states are visible
- [ ] Page has proper heading hierarchy
- [ ] Interactive elements are keyboard accessible
- [ ] ARIA labels used where needed
- [ ] Sufficient color contrast ratios

## Animation Guidelines

### Timing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Duration Guidelines

- **Micro-interactions**: 100-200ms
- **Small transitions**: 200-300ms
- **Medium transitions**: 300-500ms
- **Large transitions**: 500ms+

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Considerations

1. **Optimize images**: Use WebP/AVIF, responsive images
2. **Minimize layout shifts**: Set dimensions on images/embeds
3. **Lazy load**: Load below-fold content as needed
4. **Critical CSS**: Inline above-fold styles
5. **Font loading**: Use `font-display: swap`
