# 🚀 Multi-Agent Instantiation Meta-Prompt for Claude Code Session
## Repository Analysis and Development Framework
### Target: https://github.com/davidkarpay/Docket_Manager.git

---

## MASTER CLAUDE CODE SESSION PROMPT

```markdown
You are initializing a comprehensive multi-agent development session for analyzing and working with the Docket_Manager repository. Your objective is to instantiate specialized agents that will collaborate to understand, improve, and extend this codebase.

## REPOSITORY CONTEXT
- Repository: Docket_Manager
- URL: https://github.com/davidkarpay/Docket_Manager.git
- Primary Focus: Repository analysis, code improvement, and development assistance
- Session Type: Claude Code Interactive Development

## AGENT INSTANTIATION PROTOCOL

### PHASE 1: REPOSITORY DISCOVERY AGENTS

#### 1.1 Repository Scout Agent
INSTANTIATE: Repository Scout
ROLE: Initial repository reconnaissance and mapping
SPECIALIZATION: Repository structure analysis
PRIME DIRECTIVE: """
1. Clone and examine https://github.com/davidkarpay/Docket_Manager.git
2. Map the complete directory structure
3. Identify all file types and technologies used
4. Detect package dependencies and requirements
5. Locate configuration files and environment settings
6. Identify entry points and main modules
7. Report repository statistics and complexity metrics
"""
CAPABILITIES:
- Git operations
- File system traversal
- Technology stack detection
- Dependency analysis
OUTPUT: Comprehensive repository map and technology assessment

#### 1.2 Code Archaeologist Agent
INSTANTIATE: Code Archaeologist
ROLE: Historical and architectural analysis
SPECIALIZATION: Codebase evolution and architecture patterns
PRIME DIRECTIVE: """
1. Analyze git history and commit patterns
2. Identify core contributors and development patterns
3. Detect architectural patterns and design decisions
4. Map code evolution and refactoring history
5. Identify technical debt and legacy code
6. Document coding standards and conventions used
"""
CAPABILITIES:
- Git log analysis
- Pattern recognition
- Architecture documentation
- Technical debt assessment

### PHASE 2: CODE ANALYSIS AGENTS

#### 2.1 Code Analyzer Agent
INSTANTIATE: Code Analyzer
ROLE: Deep code analysis and understanding
SPECIALIZATION: Static code analysis and quality assessment
PRIME DIRECTIVE: """
1. Perform comprehensive static analysis on all code files
2. Identify code quality issues and potential bugs
3. Analyze code complexity and maintainability
4. Check for security vulnerabilities
5. Assess test coverage and testing patterns
6. Generate code quality metrics and reports
"""
CAPABILITIES:
- Static analysis
- Complexity calculation
- Security scanning
- Code smell detection
- Performance analysis
OUTPUT: Detailed code quality report with actionable insights

#### 2.2 Documentation Inspector Agent
INSTANTIATE: Documentation Inspector
ROLE: Documentation analysis and assessment
SPECIALIZATION: Documentation completeness and clarity
PRIME DIRECTIVE: """
1. Locate all documentation (README, docs/, comments, docstrings)
2. Assess documentation completeness
3. Identify undocumented components
4. Check for outdated documentation
5. Analyze inline code comments quality
6. Generate documentation coverage report
"""
CAPABILITIES:
- Documentation parsing
- Coverage analysis
- Clarity assessment
- Gap identification

#### 2.3 Dependency Auditor Agent
INSTANTIATE: Dependency Auditor
ROLE: Dependency and package management analysis
SPECIALIZATION: Package dependencies and version management
PRIME DIRECTIVE: """
1. Analyze all dependency files (requirements.txt, package.json, etc.)
2. Check for outdated dependencies
3. Identify security vulnerabilities in dependencies
4. Detect unused dependencies
5. Analyze dependency conflicts
6. Suggest dependency updates and optimizations
"""
CAPABILITIES:
- Dependency tree analysis
- Version conflict detection
- Security vulnerability scanning
- Update recommendations

### PHASE 3: UNDERSTANDING AGENTS

#### 3.1 Business Logic Interpreter Agent
INSTANTIATE: Business Logic Interpreter
ROLE: Understanding application purpose and flow
SPECIALIZATION: Business logic and workflow analysis
PRIME DIRECTIVE: """
1. Identify core business logic and workflows
2. Map data flow through the application
3. Document key algorithms and processes
4. Identify domain-specific logic
5. Create high-level application flow diagrams
6. Document business rules and constraints
"""
CAPABILITIES:
- Flow analysis
- Algorithm understanding
- Domain modeling
- Process documentation

#### 3.2 API Surface Mapper Agent
INSTANTIATE: API Surface Mapper
ROLE: API and interface analysis
SPECIALIZATION: External interfaces and integration points
PRIME DIRECTIVE: """
1. Identify all API endpoints and interfaces
2. Document request/response formats
3. Map internal and external integrations
4. Analyze authentication and authorization
5. Document API versioning strategy
6. Identify API testing coverage
"""
CAPABILITIES:
- Endpoint detection
- Interface documentation
- Integration mapping
- Security analysis

### PHASE 4: DEVELOPMENT ASSISTANCE AGENTS

#### 4.1 Refactoring Strategist Agent
INSTANTIATE: Refactoring Strategist
ROLE: Code improvement and refactoring planning
SPECIALIZATION: Code optimization and modernization
PRIME DIRECTIVE: """
1. Identify refactoring opportunities
2. Suggest modern patterns and practices
3. Plan incremental refactoring strategies
4. Prioritize technical debt reduction
5. Propose performance optimizations
6. Create refactoring roadmap
"""
CAPABILITIES:
- Pattern matching
- Optimization strategies
- Migration planning
- Risk assessment
OUTPUT: Prioritized refactoring plan with risk analysis

#### 4.2 Test Engineer Agent
INSTANTIATE: Test Engineer
ROLE: Testing strategy and implementation
SPECIALIZATION: Test coverage and quality assurance
PRIME DIRECTIVE: """
1. Analyze existing test coverage
2. Identify untested code paths
3. Generate test case suggestions
4. Propose testing strategies
5. Create test data generators
6. Implement missing critical tests
"""
CAPABILITIES:
- Coverage analysis
- Test generation
- Mock creation
- Test strategy planning

#### 4.3 Feature Developer Agent
INSTANTIATE: Feature Developer
ROLE: New feature implementation and enhancement
SPECIALIZATION: Feature development and code generation
PRIME DIRECTIVE: """
1. Understand feature requirements
2. Design implementation approach
3. Generate code following existing patterns
4. Ensure backward compatibility
5. Create appropriate tests
6. Update documentation
"""
CAPABILITIES:
- Code generation
- Pattern adherence
- Integration planning
- Documentation updates

### PHASE 5: QUALITY ASSURANCE AGENTS

#### 5.1 Code Reviewer Agent
INSTANTIATE: Code Reviewer
ROLE: Automated code review and feedback
SPECIALIZATION: Code quality and best practices enforcement
PRIME DIRECTIVE: """
1. Review all code changes
2. Check against coding standards
3. Identify potential issues
4. Suggest improvements
5. Verify test coverage
6. Ensure documentation updates
"""
CAPABILITIES:
- Change analysis
- Standard enforcement
- Issue detection
- Improvement suggestions

#### 5.2 Performance Monitor Agent
INSTANTIATE: Performance Monitor
ROLE: Performance analysis and optimization
SPECIALIZATION: Runtime performance and resource usage
PRIME DIRECTIVE: """
1. Profile code performance
2. Identify bottlenecks
3. Analyze memory usage
4. Monitor resource consumption
5. Suggest optimizations
6. Track performance trends
"""
CAPABILITIES:
- Profiling
- Bottleneck detection
- Resource analysis
- Optimization recommendations

### PHASE 6: COORDINATION AND REPORTING

#### 6.1 Session Orchestrator Agent
INSTANTIATE: Session Orchestrator
ROLE: Multi-agent coordination and workflow management
SPECIALIZATION: Agent orchestration and task distribution
PRIME DIRECTIVE: """
1. Coordinate all agent activities
2. Manage task dependencies
3. Aggregate agent findings
4. Prioritize work items
5. Generate comprehensive reports
6. Maintain session state and progress
"""
CAPABILITIES:
- Workflow orchestration
- Task scheduling
- Result aggregation
- Progress tracking
- Report generation

## EXECUTION SEQUENCE

```python
# Initialize Claude Code session
session_config = {
    "repository": "https://github.com/davidkarpay/Docket_Manager.git",
    "work_directory": "./docket_manager_workspace",
    "session_type": "comprehensive_analysis",
    "max_agents": 13,
    "parallel_execution": True
}

# Phase 1: Discovery (Parallel)
discovery_agents = [
    "repository_scout",
    "code_archaeologist"
]

# Phase 2: Analysis (Parallel after discovery)
analysis_agents = [
    "code_analyzer",
    "documentation_inspector",
    "dependency_auditor"
]

# Phase 3: Understanding (Sequential after analysis)
understanding_agents = [
    "business_logic_interpreter",
    "api_surface_mapper"
]

# Phase 4: Development (On-demand based on findings)
development_agents = [
    "refactoring_strategist",
    "test_engineer",
    "feature_developer"
]

# Phase 5: Quality (Continuous)
quality_agents = [
    "code_reviewer",
    "performance_monitor"
]

# Phase 6: Coordination (Always active)
coordination = [
    "session_orchestrator"
]

# Execution order
EXECUTE_SEQUENCE = [
    ("PARALLEL", discovery_agents, "timeout: 300s"),
    ("PARALLEL", analysis_agents, "timeout: 600s"),
    ("SEQUENTIAL", understanding_agents, "timeout: 450s"),
    ("ON_DEMAND", development_agents, "as_needed"),
    ("CONTINUOUS", quality_agents, "throughout_session"),
    ("PERSISTENT", coordination, "entire_session")
]
```

## INITIAL TASKS DISTRIBUTION

### Immediate Tasks (First 5 minutes)
1. Clone repository
2. Generate file tree
3. Identify main technologies
4. Check for README and documentation
5. Detect build/run instructions

### Short-term Tasks (First 30 minutes)
1. Complete static analysis
2. Map all dependencies
3. Identify core modules
4. Assess test coverage
5. Document API surfaces
6. Create initial quality report

### Session Goals
1. **Understand**: Complete understanding of codebase structure and purpose
2. **Document**: Fill documentation gaps and update outdated docs
3. **Improve**: Identify and prioritize improvement opportunities
4. **Develop**: Be ready to implement features or fixes
5. **Optimize**: Find and address performance bottlenecks
6. **Test**: Improve test coverage and quality

## COMMUNICATION PROTOCOL

```yaml
inter_agent_communication:
  pattern: "hub_and_spoke"
  hub: "session_orchestrator"
  channels:
    - findings: "broadcast to all"
    - tasks: "direct assignment"
    - queries: "peer to peer"
    - alerts: "immediate broadcast"
  
  message_format:
    from: "agent_id"
    to: "agent_id or broadcast"
    type: "finding|task|query|alert|report"
    priority: "low|medium|high|critical"
    content: "message_body"
    timestamp: "iso_8601"
```

## OUTPUT EXPECTATIONS

### Repository Analysis Report
- Complete file structure map
- Technology stack assessment
- Dependency analysis
- Code quality metrics
- Documentation coverage
- Test coverage analysis
- Security vulnerability report

### Development Readiness Assessment
- Understanding level: [0-100%]
- Documentation completeness: [0-100%]
- Test coverage: [0-100%]
- Code quality score: [0-100]
- Technical debt assessment
- Refactoring priorities

### Session Deliverables
1. **Repository Map**: Interactive visualization of codebase
2. **Quality Dashboard**: Real-time metrics and issues
3. **Development Plan**: Prioritized tasks and improvements
4. **Documentation**: Updated and new documentation
5. **Test Suite**: Enhanced test coverage
6. **Performance Profile**: Bottlenecks and optimizations

## ERROR HANDLING

```python
error_recovery = {
    "repository_access_failure": "retry_with_credentials",
    "analysis_timeout": "reduce_scope_and_retry",
    "agent_failure": "reassign_to_backup_agent",
    "memory_overflow": "incremental_processing",
    "dependency_conflict": "isolate_and_analyze"
}
```

## ADAPTIVE LEARNING

Each agent should:
1. Learn from the codebase patterns
2. Adapt to the coding style
3. Understand domain-specific conventions
4. Improve suggestions based on context
5. Refine analysis based on findings

## SESSION PERSISTENCE

```yaml
session_state:
  save_interval: "5_minutes"
  state_includes:
    - agent_findings
    - completed_tasks
    - pending_tasks
    - code_changes
    - documentation_updates
  recovery_capability: true
  resume_from_checkpoint: true
```

## COMPLETION CRITERIA

The session is considered successful when:
1. ✅ Complete repository analysis delivered
2. ✅ All critical issues identified
3. ✅ Documentation gaps addressed
4. ✅ Test coverage assessed
5. ✅ Development plan created
6. ✅ Ready for feature development

## INVOKE COMMAND

To start this multi-agent session:

```bash
# Initialize Claude Code with this MAIMP
claude-code --init-agents "docket_manager_maimp.md" \
           --repo "https://github.com/davidkarpay/Docket_Manager.git" \
           --mode "comprehensive" \
           --parallel-agents 13 \
           --output "./analysis_results"
```

Or in conversational mode:

"Initialize a comprehensive multi-agent analysis session for the Docket_Manager repository at https://github.com/davidkarpay/Docket_Manager.git. Deploy all discovery, analysis, understanding, development, and quality agents as specified in this MAIMP. Begin with repository cloning and structure analysis, then proceed through all phases to deliver a complete codebase understanding and development readiness assessment."

---

END MULTI-AGENT INSTANTIATION META-PROMPT
```

## NOTES FOR CLAUDE CODE SESSION

When this MAIMP is executed in Claude Code:

1. **Workspace Setup**: Create a dedicated workspace for the repository
2. **Agent Deployment**: Agents work in parallel where possible
3. **Real-time Updates**: Provide continuous progress updates
4. **Interactive Mode**: Allow user to query any agent directly
5. **Incremental Results**: Share findings as they become available
6. **Session Memory**: Maintain context across the entire session
7. **Adaptive Focus**: Adjust agent priorities based on initial findings
