# AiBot — Launch 5 Parallel Agents
# Usage: .\agents\launch.ps1
# Each agent runs in its own Windows Terminal tab

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AiBot — Launching 5 Parallel Agents"   -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Agent prompts
$agents = @(
    @{
        Name = "Agent-1-Bugfixer"
        Color = "Red"
        Prompt = @"
Ты Agent-1 BUGFIXER. Прочитай файлы в таком порядке:
1. agents/shared/PROJECT_CONTEXT.md
2. agents/agent-1-bugfixer/ROLE.md
3. agents/agent-1-bugfixer/TASKS.md
4. agents/agent-1-bugfixer/MEMORY.md

Затем выполни ВСЕ задачи из TASKS.md по порядку. Используй скиллы и MCP tools как указано в ROLE.md. После завершения создай agents/agent-1-bugfixer/DONE.md с отчётом.
"@
    },
    @{
        Name = "Agent-2-Cleaner"
        Color = "Yellow"
        Prompt = @"
Ты Agent-2 CLEANER. Прочитай файлы в таком порядке:
1. agents/shared/PROJECT_CONTEXT.md
2. agents/agent-2-cleaner/ROLE.md
3. agents/agent-2-cleaner/TASKS.md
4. agents/agent-2-cleaner/MEMORY.md

Затем выполни ВСЕ задачи из TASKS.md по порядку. Используй скиллы и MCP tools как указано в ROLE.md. После завершения создай agents/agent-2-cleaner/DONE.md с отчётом.
"@
    },
    @{
        Name = "Agent-3-Builder"
        Color = "Green"
        Prompt = @"
Ты Agent-3 BUILDER. Прочитай файлы в таком порядке:
1. agents/shared/PROJECT_CONTEXT.md
2. agents/agent-3-builder/ROLE.md
3. agents/agent-3-builder/TASKS.md
4. agents/agent-3-builder/MEMORY.md

Затем выполни ВСЕ задачи из TASKS.md по порядку. Используй скиллы и MCP tools как указано в ROLE.md. После завершения создай agents/agent-3-builder/DONE.md с отчётом и списком созданных endpoints.
"@
    },
    @{
        Name = "Agent-4-Designer"
        Color = "Magenta"
        Prompt = @"
Ты Agent-4 DESIGNER. Прочитай файлы в таком порядке:
1. agents/shared/PROJECT_CONTEXT.md
2. agents/agent-4-designer/ROLE.md
3. agents/agent-4-designer/TASKS.md
4. agents/agent-4-designer/MEMORY.md

НАЧНИ с Phase A (Design System) и Phase B (Landing) — они не зависят от других агентов. Phase D (Gamification UI) делай ПОСЛЕ появления файла agents/agent-3-builder/DONE.md. Используй frontend-design skill, mcp__shadcn, mcp__magic для каждого компонента. После завершения создай agents/agent-4-designer/DONE.md.
"@
    },
    @{
        Name = "Agent-5-Tester"
        Color = "Cyan"
        Prompt = @"
Ты Agent-5 TESTER. Прочитай файлы в таком порядке:
1. agents/shared/PROJECT_CONTEXT.md
2. agents/agent-5-tester/ROLE.md
3. agents/agent-5-tester/TASKS.md
4. agents/agent-5-tester/MEMORY.md

Дождись появления DONE.md файлов от всех 4 агентов. Затем выполни полный QA цикл: build, checklist, e2e тесты через Playwright MCP, responsive тесты. Используй qa-check skill. Создай итоговый agents/agent-5-tester/REPORT.md.
"@
    }
)

Write-Host "Launching agents in separate terminals..." -ForegroundColor White
Write-Host ""

foreach ($agent in $agents) {
    $name = $agent.Name
    $color = $agent.Color
    $prompt = $agent.Prompt

    Write-Host "  Starting $name..." -ForegroundColor $color

    # Launch in new Windows Terminal tab
    $escapedPrompt = $prompt -replace '"', '\"' -replace "`n", " " -replace "`r", ""

    Start-Process wt -ArgumentList @(
        "new-tab",
        "--title", $name,
        "--",
        "claude", "-p", "`"$escapedPrompt`""
    )

    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All 5 agents launched!"                -ForegroundColor Green
Write-Host "  Check Windows Terminal tabs"           -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Agent signals:" -ForegroundColor White
Write-Host "  Agent-1: agents/agent-1-bugfixer/DONE.md" -ForegroundColor Red
Write-Host "  Agent-2: agents/agent-2-cleaner/DONE.md" -ForegroundColor Yellow
Write-Host "  Agent-3: agents/agent-3-builder/DONE.md" -ForegroundColor Green
Write-Host "  Agent-4: agents/agent-4-designer/DONE.md" -ForegroundColor Magenta
Write-Host "  Agent-5: agents/agent-5-tester/REPORT.md" -ForegroundColor Cyan
