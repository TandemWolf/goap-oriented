# goap-oriented

A TypeScript implementation of Goal-Oriented Action Planning (GOAP) for game AI and automated planning.

## Features

-   Flexible action planning with dynamic costs and effects
-   State-based preconditions and effects
-   Resource management and tracking
-   Priority-based planning with heuristic optimization
-   Fully typed TypeScript implementation
-   Comprehensive test coverage
-   Well-documented API

## Installation

```bash
npm install goap-oriented
```

## Quick Start

```typescript
import { GOAPPlanner, WorldState, Action, Goal } from "goap-oriented";

// Create actions
const actions: Action[] = [
	{
		name: "CollectWood",
		cost: 1,
		preconditions: [],
		effects: [
			{
				key: "wood",
				value: (state: WorldState) => (state.wood || 0) + 5,
			},
		],
	},
	{
		name: "BuildHouse",
		cost: 2,
		preconditions: [
			{ key: "wood", value: 10, operator: "greaterThanOrEqual" },
		],
		effects: [
			{ key: "wood", value: (state: WorldState) => state.wood - 10 },
			{ key: "house", value: true },
		],
	},
];

// Set up planner
const planner = new GOAPPlanner();
actions.forEach((action) => planner.addAction(action));

// Define initial state and goal
const initialState: WorldState = { wood: 0, house: false };
const goal: Goal = {
	name: "BuildHouseGoal",
	conditions: [{ key: "house", value: true }],
};

// Find plan
const plan = planner.findPlan(initialState, goal);
// Returns: [CollectWood, CollectWood, BuildHouse]
```

## Documentation

### Action Definition

Actions are defined with the following properties:

```typescript
interface Action {
	name: string;
	cost: number | ((state: WorldState) => number);
	preconditions: ActionPrecondition[];
	effects: ActionEffect[];
	execute?: () => Promise<void> | void;
}
```

### Advanced Usage Examples

#### Dynamic Costs
```typescript
const chopTreeAction: Action = {
	name: 'ChopTree',
	cost: (state: WorldState) => state.hasBetterAxe ? 1 : 2,
	preconditions: [],
	effects: [{ key: 'wood', value: (state: WorldState) => state.wood + 1 }]
};
```

#### Complex Planning
```typescript
// Complex planning example with resource gathering, crafting, and building
const actions: Action[] = [
    {
        name: 'MineOre',
        cost: 2,
        preconditions: [
            { key: 'hasPickaxe', value: true }
        ],
        effects: [
            { key: 'ore', value: (state: WorldState) => (state.ore || 0) + 3 }
        ]
    },
    {
        name: 'CraftPickaxe',
        cost: 1,
        preconditions: [
            { key: 'wood', value: 2, operator: 'greaterThanOrEqual' },
            { key: 'stone', value: 3, operator: 'greaterThanOrEqual' }
        ],
        effects: [
            { key: 'wood', value: (state: WorldState) => state.wood - 2 },
            { key: 'stone', value: (state: WorldState) => state.stone - 3 },
            { key: 'hasPickaxe', value: true }
        ]
    },
    {
        name: 'GatherWood',
        cost: 1,
        preconditions: [],
        effects: [
            { key: 'wood', value: (state: WorldState) => (state.wood || 0) + 2 }
        ]
    },
    {
        name: 'GatherStone',
        cost: 1,
        preconditions: [],
        effects: [
            { key: 'stone', value: (state: WorldState) => (state.stone || 0) + 2 }
        ]
    },
    {
        name: 'SmeltIron',
        cost: 3,
        preconditions: [
            { key: 'ore', value: 3, operator: 'greaterThanOrEqual' },
            { key: 'hasFurnace', value: true }
        ],
        effects: [
            { key: 'ore', value: (state: WorldState) => state.ore - 3 },
            { key: 'iron', value: (state: WorldState) => (state.iron || 0) + 1 }
        ]
    },
    {
        name: 'BuildFurnace',
        cost: 2,
        preconditions: [
            { key: 'stone', value: 8, operator: 'greaterThanOrEqual' }
        ],
        effects: [
            { key: 'stone', value: (state: WorldState) => state.stone - 8 },
            { key: 'hasFurnace', value: true }
        ]
    }
];

// Set up planner
const planner = new GOAPPlanner();
actions.forEach(action => planner.addAction(action));

// Initial state with no resources
const initialState: WorldState = {
    wood: 0,
    stone: 0,
    ore: 0,
    iron: 0,
    hasPickaxe: false,
    hasFurnace: false
};

// Goal: Create iron
const goal: Goal = {
    name: 'CreateIronGoal',
    conditions: [{ key: 'iron', value: 1 }]
};

// Find plan
const plan = planner.findPlan(initialState, goal);
// Returns: [GatherWood, GatherStone, GatherStone, CraftPickaxe, 
//          GatherStone, GatherStone, GatherStone, BuildFurnace, 
//          MineOre, SmeltIron]
```

## API Reference

### GOAPPlanner
- `addAction(action: Action): void`
- `removeAction(actionName: string): void`
- `findPlan(initialState: WorldState, goal: Goal): Action[]`

### Agent
- `addAction(action: Action): void`
- `executePlan(goal: Goal): Promise<boolean>`
- `getCurrentState(): WorldState`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

1. Clone the repository
```bash
git clone https://github.com/TandemWolf/goap-oriented.git
```

2. Install dependencies
```bash
npm install
```

3. Run tests
```bash
npm test
```

## Support

- Open an issue for bugs
- Feature requests welcome
- Pull requests encouraged

## License

MIT © [TandemWolf](https://github.com/TandemWolf)
