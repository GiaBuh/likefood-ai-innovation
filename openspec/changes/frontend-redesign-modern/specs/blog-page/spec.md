## ADDED Requirements

### Requirement: Blog listing page
The system SHALL provide a Blog/News listing page at route `/blog` displaying article cards in a responsive grid.

#### Scenario: Blog listing renders
- **WHEN** a user navigates to `/blog`
- **THEN** the system SHALL display a paginated grid of blog article cards, each showing a cover image, title, category tag, publication date, and excerpt

### Requirement: Blog article detail page
The system SHALL provide individual article pages at route `/blog/:slug` with full article content.

#### Scenario: Article detail renders
- **WHEN** a user clicks on a blog article card
- **THEN** the system SHALL navigate to `/blog/:slug` and display the full article with cover image, title, author, date, and rich text content

### Requirement: Blog category filtering
The system SHALL allow users to filter blog articles by category.

#### Scenario: Category filter interaction
- **WHEN** a user clicks on a category tag (e.g., "Recipes", "News", "Tips")
- **THEN** the system SHALL filter the article listing to show only articles in the selected category

### Requirement: Static content source
Blog articles SHALL be stored as static JSON data files in the frontend codebase, with each article having: slug, title, category, date, author, excerpt, coverImage, and content (HTML/markdown string).

#### Scenario: Article data loading
- **WHEN** the blog page loads
- **THEN** the system SHALL read articles from a local data file (`frontend/data/blog-articles.json`) without making backend API calls

### Requirement: Related articles suggestion
The system SHALL display related articles at the bottom of each article detail page.

#### Scenario: Related articles display
- **WHEN** a user reads an article
- **THEN** the system SHALL display up to 3 related articles from the same category at the bottom of the page
