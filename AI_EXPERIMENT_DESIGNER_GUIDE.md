# LearnBench Experiment Platform - AI Designer Guide

## System Overview
LearnBench is a versatile Google Apps Script-based platform for human-AI interaction experiments. While originally designed for decision-making studies, it serves as a general-purpose experimentation system for:
- AI-augmented decision making
- Prompt engineering skill assessment
- A/B testing of AI interactions
- Human-AI collaboration studies
- LLM behavior evaluation
- Training effectiveness measurement

Participants interact with configurable scenarios, optionally use AI assistance, and all interactions are tracked in Google Sheets for analysis.

## Core Capabilities

### 1. Scenario-Based Experiments
- **Sequential Scenarios**: Present multiple decision scenarios to participants
- **Markdown Support**: Scenarios support full markdown formatting (headers, lists, tables, bold, italic)
- **Image Support**: Optional images per scenario via URL
- **Multiple Choice**: Each scenario has 2-5 options with pre-assigned scores
- **Auto-advancement**: Scenarios can auto-advance or require manual progression

### 2. AI Integration (Gemini)
- **Optional AI Assistant**: Can be enabled/disabled per experiment
- **Context Memory**: AI can remember previous exchanges (configurable window size)
- **Image Analysis**: Participants can paste/upload images for AI to analyze
- **Token Tracking**: All AI usage is logged with token counts
- **Model Fallback**: Automatically switches between Gemini 1.5 Flash and Pro if overloaded

### 3. Data Collection Points

#### Pre-Experiment
- **Participant ID**: Generated from 4-character NRIC hash (Singapore context)
- **Demographics** (optional, configurable timing):
  - Age band (18-24, 25-34, 35-44, 45-54, 55-64, 65+)
  - Gender
  - Education level
  - Academic discipline
  - English proficiency
  - Coding experience
  - LLM usage frequency
  - Military/uniformed service experience

#### During Experiment
- **Scenario Responses**: Option selected, score, timestamp
- **AI Interactions**: Full prompt/response pairs with timestamps
- **Token Usage**: Per interaction and cumulative
- **Timing Data**: Response times, session duration
- **Cohort Detection**: Automatic clustering of class sessions

#### Post-Experiment
- **Exit Survey** (NASA-TLX style):
  - Mental demand (0-100)
  - Confidence level (0-100)
  - AI reliance (0-100)
  - Overall experience (0-100)
  - Completion time
  - Total scenarios completed

### 4. Configuration Options (Setup Sheet)

| Setting | Type | Description |
|---------|------|-------------|
| Enable AI Assistance | Boolean | Show/hide AI interface |
| Enable Context | Boolean | AI memory across prompts |
| Context Window Size | Number | Previous exchanges to remember (default: 5) |
| Enable Demographics | Boolean | Collect demographic data |
| Prompts Before Demographics | Number | When to show demographics form |
| Auto-advance Scenarios | Boolean | Auto-proceed after submission |
| Auto-close on Complete | Boolean | Close tab when finished |
| Allow Out of Class | Boolean | Accept submissions anytime |
| Timezone | String | For cohort scheduling |
| Enable Exit Survey | Boolean | Show post-experiment survey |

### 5. Spreadsheet Structure

#### Required Sheets
- **Prompts**: Main log (timestamp, participant, cohort, prompt, response, tokens)
- **Scenarios**: Experiment scenarios
- **Setup**: Configuration settings

#### Auto-Created Sheets
- **Demographics**: Participant information
- **Scenario_Responses**: MCQ responses and scores
- **Exit_Survey**: Post-experiment metrics
- **Session_Metrics**: Aggregate session data

### 6. Scenario Sheet Format

| Column | Field | Description |
|--------|-------|-------------|
| A | ScenarioID | Unique identifier (e.g., S001) |
| B | ScenarioText | Markdown-formatted scenario |
| C | ImageURL | Optional image URL |
| D | Option1 | First choice text |
| E | Score1 | Points for Option1 |
| F | Option2 | Second choice text |
| G | Score2 | Points for Option2 |
| ... | ... | Up to Option5/Score5 |

### 7. Cohort Management
- **Automatic Detection**: Clusters participants by submission timing
- **Manual Override**: Can assign cohorts manually
- **Cold Start Handling**: Retroactive cohort assignment
- **Activity Tracking**: IN-CLASS vs OUT-OF-CLASS status

### 8. Key Features for Experiment Design

#### Randomization Options
- Scenarios presented in sequence (no built-in randomization)
- Can duplicate scenarios with different IDs for between-subjects designs

#### Conditional Logic
- Demographics shown after N prompts OR N scenarios
- AI availability can be toggled mid-experiment via config

#### Data Quality
- **Duplicate Prevention**: 5-second submission window blocking
- **Scientific Notation Prevention**: Participant IDs forced to strings
- **Session Tracking**: Unique session IDs prevent data mixing
- **Cache Management**: 2-hour cache for performance

#### Scalability
- Handles 100+ concurrent participants
- Automatic cohort clustering for class sessions
- Optimized sheet operations for large datasets

### 9. Deployment
- **Platform**: Google Apps Script web app
- **Access**: Anonymous access, no login required
- **URL**: Single deployment URL for all participants
- **Updates**: Changes reflect immediately (with cache clear)

### 10. Experiment Workflow

1. **Setup Phase**
   - Configure settings in Setup sheet
   - Add scenarios to Scenarios sheet
   - Set demographics timing
   - Enable/disable AI features

2. **Running Phase**
   - Participants access URL
   - Enter 4-character ID
   - Complete scenarios (with optional AI)
   - Provide demographics (if enabled)
   - Complete exit survey (if enabled)

3. **Data Collection**
   - Real-time data in Google Sheets
   - Automatic cohort detection
   - Token usage tracking
   - Response scoring

### 11. Limitations
- No built-in randomization (scenarios are sequential)
- Single spreadsheet backend (no multi-tenancy)
- 2-hour cache persistence
- No real-time collaboration features
- Limited to Google's execution quotas

### 12. Best Practices for Experiment Design
1. **Test scenarios** with a TEST_USER participant first
2. **Clear cache** after configuration changes (EMERGENCY_CLEAR_ALL_CACHES function)
3. **Monitor cohort detection** for first few participants
4. **Set appropriate demographics timing** (after 1 prompt for testing, 3+ for production)
5. **Use markdown** for rich scenario formatting
6. **Include images** sparingly (affects load time)
7. **Design for 5-15 minute sessions** optimal engagement
8. **Score options meaningfully** for analysis

## Quick Start for New Experiment

```javascript
// 1. Set spreadsheet ID in Script Properties
PROMPTLAB_SHEET_ID: 'your-sheet-id'

// 2. Add scenarios to Scenarios sheet
ScenarioID | ScenarioText | ImageURL | Option1 | Score1 | Option2 | Score2
S001 | "Your scenario..." | null | "Choice A" | 10 | "Choice B" | 5

// 3. Configure Setup sheet
Enable AI: ✓
Enable Demographics: ✓
Prompts Before Demographics: 3
Auto-advance: ✓

// 4. Deploy and share URL
```

## Data Analysis Endpoints
All data accessible via Google Sheets API or manual export:
- Response distributions by scenario
- AI usage patterns
- Token consumption metrics  
- Completion rates
- Time-on-task analysis
- Cohort comparisons
- Score aggregations
- Prompt quality metrics
- Learning curve analysis

## Example Use Cases

### 1. Prompt Engineering Skill Assessment
**Setup**: Create scenarios that are coding challenges or analysis tasks
```
ScenarioID: PE001
ScenarioText: "## Debug this Python Function
The following function should return the nth Fibonacci number but has bugs:
```python
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-1)
```
Use the AI to help you identify and fix the bug."

Options:
- "Found and fixed: fib(n-2) needed" (Score: 10)
- "Found bug but wrong fix" (Score: 5)
- "Couldn't identify the issue" (Score: 0)
```
**Metrics**: Track prompting strategies, token efficiency, success rates

### 2. A/B Testing AI Features
**Setup**: Duplicate scenarios with different IDs, toggle AI features between cohorts
```
Cohort A: Enable AI with context (memory)
Cohort B: Enable AI without context
Cohort C: No AI assistance

Compare: Decision quality, time-to-decision, confidence levels
```
**Analysis**: Exit survey confidence scores, option score distributions

### 3. Human-AI Collaboration Patterns
**Setup**: Complex multi-step scenarios requiring AI interaction
```
ScenarioText: "## Medical Diagnosis Case
Patient presents with: fever, headache, rash on torso...
What diagnostic tests would you order?"

Track: How participants query AI, what information they seek, decision confidence
```
**Metrics**: Prompt patterns, AI reliance scores, outcome quality

### 4. Training Effectiveness
**Setup**: Pre/post training scenarios with same structure
```
Week 1: Baseline prompt engineering skills
Week 2-3: Training intervention
Week 4: Post-training assessment

Same scenarios, compare prompt quality and task success
```
**Analysis**: Learning curves, skill improvement, strategy evolution

### 5. LLM Behavior Documentation
**Setup**: Systematic probing of AI responses
```
ScenarioText: "Test the AI's ability to handle ambiguous requests"
Options evaluate quality of participant's test cases

Track: What edge cases participants discover, AI failure modes
```
**Metrics**: Coverage of test cases, AI response patterns

### 6. Comparative Prompting Strategies
**Setup**: Open-ended scenarios with score based on approach
```
ScenarioText: "Get the AI to write a haiku about databases"
Options:
- "Used creative metaphor approach" (Score: 10)
- "Direct instruction approach" (Score: 7)
- "Provided examples approach" (Score: 8)
```
**Analysis**: Strategy effectiveness across participant groups

## Extending for Custom Experiments

The platform's flexibility allows for creative experiment designs:

1. **Time-pressure studies**: Use auto-advance with short delays
2. **Iterative refinement**: Multiple attempts at same scenario
3. **Peer learning**: Share successful prompts in scenario text
4. **Adversarial prompting**: Score based on finding AI limitations
5. **Calibration studies**: Compare human vs AI confidence
6. **Workflow optimization**: Multi-step tasks with checkpoints

## Key Advantages for General Experimentation

- **Low barrier**: No coding required for experimenters
- **Real-time data**: Immediate access to results
- **Natural interaction**: Familiar chat-like interface
- **Flexible scoring**: Arbitrary point systems for any metric
- **Rich content**: Markdown + images for complex scenarios
- **Scale**: Handles classroom to crowdsource scale
- **Cost tracking**: Token usage for budget management

---
*Platform Version: 2.0 | Last Updated: August 2025*