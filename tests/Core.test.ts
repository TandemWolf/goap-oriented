import { GOAPPlanner } from '../src/Planner';
import { Action, Goal, WorldState } from '../src/types';

describe('GOAP Core Functionality', () => {
    test('should handle multiple valid paths', () => {
        const planner = new GOAPPlanner();

        const actions: Action[] = [
            {
                name: 'PathA',
                cost: 2,
                preconditions: [],
                effects: [{ key: 'goal', value: true }]
            },
            {
                name: 'PathB',
                cost: 1,
                preconditions: [],
                effects: [{ key: 'goal', value: true }]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = { goal: false };
        const goal: Goal = {
            name: 'MultiPathGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('PathB'); // Should choose lowest cost path
    });

    test('should handle compound effects', () => {
        const planner = new GOAPPlanner();

        const action: Action = {
            name: 'CompoundAction',
            cost: 1,
            preconditions: [],
            effects: [
                { key: 'stateA', value: true },
                { key: 'stateB', value: true },
                { key: 'stateC', value: true }
            ]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            stateA: false,
            stateB: false,
            stateC: false
        };

        const goal: Goal = {
            name: 'CompoundGoal',
            conditions: [
                { key: 'stateA', value: true },
                { key: 'stateB', value: true },
                { key: 'stateC', value: true }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('CompoundAction');
    });

    test('should handle sequential dependent actions', () => {
        const planner = new GOAPPlanner();

        // Mark resources as a consumed resource
        planner.markAsResource('resources');

        const actions: Action[] = [
            {
                name: 'CollectResources',
                cost: 1,
                preconditions: [],
                effects: [{ key: 'resources', value: 10 }]
            },
            {
                name: 'ProcessResources',
                cost: 1,
                preconditions: [
                    { key: 'resources', value: 5, operator: 'greaterThanOrEqual' }
                ],
                effects: [
                    { key: 'resources', value: (state: WorldState) => state.resources - 5 },
                    { key: 'processedResources', value: (state: WorldState) => (state.processedResources || 0) + 1 }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            resources: 0,
            processedResources: 0
        };

        const goal: Goal = {
            name: 'ProcessingGoal',
            conditions: [{ key: 'processedResources', value: 2 }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(4);
        expect(plan[0].name).toBe('CollectResources');
        expect(plan[1].name).toBe('ProcessResources');
        expect(plan[2].name).toBe('CollectResources');
        expect(plan[3].name).toBe('ProcessResources');
    });

    test('should handle alternative paths with different costs', () => {
        const planner = new GOAPPlanner();

        const actions: Action[] = [
            {
                name: 'ExpensivePath',
                cost: (state: WorldState) => state.resources * 3,
                preconditions: [{ key: 'resources', value: 0, operator: 'greaterThan' }],
                effects: [{ key: 'goal', value: true }]
            },
            {
                name: 'CheapPath',
                cost: (state: WorldState) => state.resources * 0.5,
                preconditions: [{ key: 'resources', value: 9, operator: 'greaterThan' }], // Changed from 10 to 9
                effects: [{ key: 'goal', value: true }]
            },
            {
                name: 'AddResources',
                cost: 1,
                preconditions: [],
                effects: [
                    { key: 'resources', value: (state: WorldState) => (state.resources || 0) + 5 }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = { resources: 0 };
        const goal: Goal = {
            name: 'EfficientPathGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);

        // Path costs:
        // ExpensivePath after one AddResources: 1 + (5 * 3) = 16
        // CheapPath after two AddResources: 1 + 1 + (10 * 0.5) = 7

        expect(plan).toHaveLength(3);
        expect(plan[0].name).toBe('AddResources');
        expect(plan[1].name).toBe('AddResources');
        expect(plan[2].name).toBe('CheapPath');

        // Verify total cost
        let state: WorldState = { resources: 0 };
        let totalCost = 0;

        for (const action of plan) {
            totalCost += typeof action.cost === 'function' ? action.cost(state) : action.cost;
            for (const effect of action.effects) {
                const newValue = typeof effect.value === 'function'
                    ? effect.value(state)
                    : effect.value;
                state = { ...state, [effect.key]: newValue };
            }
        }

        expect(totalCost).toBeLessThan(10);
    });

    test('should handle sequential action chains with dependencies', () => {
        const planner = new GOAPPlanner();

        const actions: Action[] = [
            {
                name: 'InitialSetup',
                cost: 1,
                preconditions: [],
                effects: [
                    { key: 'setup', value: true },
                    { key: 'counter', value: 0 }
                ]
            },
            {
                name: 'IncrementCounter',
                cost: 1,
                preconditions: [
                    { key: 'setup', value: true },
                    { key: 'counter', value: 5, operator: 'lessThan' }
                ],
                effects: [
                    { key: 'counter', value: (state: WorldState) => (state.counter || 0) + 1 }
                ]
            },
            {
                name: 'Finalize',
                cost: 1,
                preconditions: [
                    { key: 'counter', value: 3, operator: 'greaterThanOrEqual' }
                ],
                effects: [{ key: 'completed', value: true }]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            setup: false,
            counter: 0,
            completed: false
        };

        const goal: Goal = {
            name: 'ChainedActionsGoal',
            conditions: [{ key: 'completed', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(5);
        expect(plan[0].name).toBe('InitialSetup');
        expect(plan[1].name).toBe('IncrementCounter');
        expect(plan[2].name).toBe('IncrementCounter');
        expect(plan[3].name).toBe('IncrementCounter');
        expect(plan[4].name).toBe('Finalize');
    });

    test('should handle branching paths with shared prerequisites', () => {
        const planner = new GOAPPlanner();

        const actions: Action[] = [
            {
                name: 'GetTools',
                cost: 1,
                preconditions: [],
                effects: [{ key: 'hasTools', value: true }]
            },
            {
                name: 'PathA',
                cost: 2,
                preconditions: [{ key: 'hasTools', value: true }],
                effects: [{ key: 'goalA', value: true }]
            },
            {
                name: 'PathB',
                cost: 3,
                preconditions: [{ key: 'hasTools', value: true }],
                effects: [{ key: 'goalB', value: true }]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            hasTools: false,
            goalA: false,
            goalB: false
        };

        const goal: Goal = {
            name: 'BranchingGoal',
            conditions: [
                { key: 'goalA', value: true },
                { key: 'goalB', value: true }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(3);
        expect(plan[0].name).toBe('GetTools');
        expect(plan.some(action => action.name === 'PathA')).toBe(true);
        expect(plan.some(action => action.name === 'PathB')).toBe(true);
    });
});