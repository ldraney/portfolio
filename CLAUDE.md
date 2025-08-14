# Claude Code Configuration for Portfolio & Obsidian Integration

## Project Overview
This repository serves as both a professional portfolio (Quartz static site) and a personal knowledge management system (Obsidian vault).

## Directory Structure

### Public Content (Published to Portfolio)
- `content/` - Public portfolio content
  - `capabilities/` - Technical expertise and frameworks
  - `case-studies/` - Client work examples (anonymized)
  - `documentation/` - Methodology frameworks and philosophy
  - `services/` - Service offerings and consulting process
  - `contact/` - Consultation and engagement process

### Private Content (Obsidian Only)
- `private/` - Personal notes and internal documentation
  - `daily-notes/` - Daily journaling and reflection
  - `meetings/` - Leadership and project meeting notes
  - `todos/` - Task management and parking lot items
  - `projects/` - Active project tracking

## Workflow Integration

### Daily Journaling with Claude Code
This repository is optimized for daily knowledge capture and processing:

1. **Morning Planning**: Use daily notes in `private/daily-notes/` for:
   - Task prioritization and sprint planning
   - Leadership meeting preparation
   - Project status tracking
   - Strategic thinking and reflection

2. **Knowledge Processing**: Claude Code can help with:
   - Extracting insights from daily notes for publication
   - Converting meeting notes into methodologies
   - Creating documentation frameworks from experiences
   - Anonymizing client work for case studies

3. **Content Publishing**: Automated workflow for:
   - Sanitizing private content for public consumption
   - Generating professional documentation
   - Creating case studies from project experiences
   - Building methodology frameworks

### Claude Code Commands and Workflows

#### Content Creation and Processing
```bash
# Process daily notes for publishable insights
claude process-insights --source private/daily-notes --target content/insights

# Generate case study from project notes
claude create-case-study --project "project-name" --anonymize true

# Update documentation frameworks based on recent experiences
claude update-docs --source private/meetings --target content/documentation
```

#### Site Management
```bash
# Build and preview changes
npx quartz build && npx quartz serve

# Publish to GitHub Pages
git add . && git commit -m "Update content" && git push
```

## Obsidian Integration

### Vault Configuration
This directory can be opened directly in Obsidian as a vault:

1. **Templates**: Use `templates/daily-note.md` for consistent daily journaling
2. **Tagging Strategy**: 
   - `#private` - Never publish
   - `#draft` - Needs review before publishing  
   - `#publishable` - Ready for public content
   - `#methodology` - Framework or process documentation

### Cross-Referencing System
- Use `[[]]` links for internal connections
- Private notes can reference public content
- Public content avoids referencing private notes

### Plugin Recommendations
- Daily Notes - Automated daily note creation
- Templater - Dynamic templates with date/time
- Kanban - Visual task management
- Graph Analysis - Knowledge connection mapping

## Content Sanitization Rules

When converting private notes to public content:

### Automatic Removals
- Personal names → Roles ("CEO", "Tech Lead") 
- Company names → Industry descriptors ("Manufacturing Client")
- Specific numbers → Ranges ("$X-Y range")
- Internal systems → Generic terms ("CRM System")

### Enhancement Additions  
- Public context and background
- Relevant diagrams and visualizations
- Cross-references to related content
- Professional metadata and tagging

## AI Agent Integration

This repository demonstrates the AI Agent Corporate Structure methodology:

### Development Workflow
- **PM Agent**: Reviews scope and tickets in project notes
- **Dev Agent**: Processes approved work items  
- **QA Agent**: Validates implementation and documentation
- **Content Agent**: Manages knowledge extraction and publishing

### Knowledge Management
- **Scanner Agent**: Processes daily notes for insights
- **Curator Agent**: Manages content quality and consistency
- **Publisher Agent**: Handles sanitization and deployment

## Success Metrics

### Content Production
- Daily insights extracted: 5-10 per week
- Meeting methodologies: 2-3 per month
- Publishing efficiency: <2 hours note to publication

### Knowledge Quality
- Cross-reference density in documentation
- Methodology framework completeness
- Case study professional presentation

## Commands for Common Tasks

### Daily Workflow
```bash
# Start daily journaling session
claude start-journal --date today --template daily-note

# Review yesterday's insights  
claude review-insights --date yesterday --extract publishable

# Update project status
claude update-projects --source private/todos --sync content/case-studies
```

### Content Management
```bash
# Generate new case study
claude create-case-study --anonymize --source private/projects

# Update methodology documentation
claude sync-methodologies --source private/meetings --target content/documentation

# Build and deploy site
claude publish-site --build --deploy
```

This configuration enables seamless integration between private knowledge capture and professional content creation, maintaining the bridge between sales (portfolio) and fulfillment (actual methodologies and frameworks).