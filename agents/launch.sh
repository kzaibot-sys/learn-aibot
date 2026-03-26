#!/bin/bash
# AiBot — Launch 5 Parallel Agents
# Usage: bash agents/launch.sh
# Each agent runs in its own terminal (using Windows Terminal wt or fallback)

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================"
echo "  AiBot — Launching 5 Parallel Agents"
echo "========================================"
echo ""

# Function to launch agent
launch_agent() {
    local name="$1"
    local dir="$2"
    local prompt="$3"

    echo "  Starting $name..."

    # Try Windows Terminal first, then fallback to cmd
    if command -v wt.exe &> /dev/null; then
        wt.exe new-tab --title "$name" -- bash -c "cd '$PROJECT_ROOT' && claude -p \"$prompt\""
    elif command -v cmd.exe &> /dev/null; then
        cmd.exe /c start "$name" bash -c "cd '$PROJECT_ROOT' && claude -p \"$prompt\""
    else
        # Linux/Mac: use new terminal
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$name" -- bash -c "cd '$PROJECT_ROOT' && claude --print \"$prompt\"; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$name" -e "cd '$PROJECT_ROOT' && claude --print \"$prompt\"" &
        else
            echo "    [FALLBACK] Running $name in background..."
            (cd "$PROJECT_ROOT" && claude --print "$prompt" > "agents/$dir/output.log" 2>&1) &
        fi
    fi
    sleep 2
}

# Launch all 5 agents
launch_agent "Agent-1-Bugfixer" "agent-1-bugfixer" \
    "Ты Agent-1 BUGFIXER. Прочитай: agents/shared/PROJECT_CONTEXT.md, agents/agent-1-bugfixer/ROLE.md, agents/agent-1-bugfixer/TASKS.md, agents/agent-1-bugfixer/MEMORY.md. Выполни ВСЕ задачи из TASKS.md. Создай agents/agent-1-bugfixer/DONE.md с отчётом."

launch_agent "Agent-2-Cleaner" "agent-2-cleaner" \
    "Ты Agent-2 CLEANER. Прочитай: agents/shared/PROJECT_CONTEXT.md, agents/agent-2-cleaner/ROLE.md, agents/agent-2-cleaner/TASKS.md, agents/agent-2-cleaner/MEMORY.md. Выполни ВСЕ задачи из TASKS.md. Создай agents/agent-2-cleaner/DONE.md с отчётом."

launch_agent "Agent-3-Builder" "agent-3-builder" \
    "Ты Agent-3 BUILDER. Прочитай: agents/shared/PROJECT_CONTEXT.md, agents/agent-3-builder/ROLE.md, agents/agent-3-builder/TASKS.md, agents/agent-3-builder/MEMORY.md. Выполни ВСЕ задачи из TASKS.md. Создай agents/agent-3-builder/DONE.md с отчётом."

launch_agent "Agent-4-Designer" "agent-4-designer" \
    "Ты Agent-4 DESIGNER. Прочитай: agents/shared/PROJECT_CONTEXT.md, agents/agent-4-designer/ROLE.md, agents/agent-4-designer/TASKS.md, agents/agent-4-designer/MEMORY.md. НАЧНИ с Landing (не зависит от других). Gamification UI делай ПОСЛЕ agents/agent-3-builder/DONE.md. Используй frontend-design skill и MCP tools. Создай agents/agent-4-designer/DONE.md."

launch_agent "Agent-5-Tester" "agent-5-tester" \
    "Ты Agent-5 TESTER. Прочитай: agents/shared/PROJECT_CONTEXT.md, agents/agent-5-tester/ROLE.md, agents/agent-5-tester/TASKS.md, agents/agent-5-tester/MEMORY.md. Дождись DONE.md от агентов 1-4. Выполни полный QA. Создай agents/agent-5-tester/REPORT.md."

echo ""
echo "========================================"
echo "  All 5 agents launched!"
echo "========================================"
echo ""
echo "Agent completion signals:"
echo "  Agent-1: agents/agent-1-bugfixer/DONE.md"
echo "  Agent-2: agents/agent-2-cleaner/DONE.md"
echo "  Agent-3: agents/agent-3-builder/DONE.md"
echo "  Agent-4: agents/agent-4-designer/DONE.md"
echo "  Agent-5: agents/agent-5-tester/REPORT.md"
