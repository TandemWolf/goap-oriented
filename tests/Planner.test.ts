import { GOAPPlanner } from '../src/Planner';
import { Action, Goal, WorldState } from '../src/types';

describe('GOAPPlanner', () => {
    let planner: GOAPPlanner;

    beforeEach(() => {
        planner = new GOAPPlanner();
    });

    test('should find simple plan with one action', () => {
        const action: Action = {
            name: 'GetWood',
            cost: 1,
            preconditions: [],
            effects: [{ key: 'hasWood', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = { hasWood: false };
        const goal: Goal = {
            name: 'GetWoodGoal',
            conditions: [{ key: 'hasWood', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('GetWood');
    });

    test('should find multi-step plan', () => {
        const actions: Action[] = [
            {
                name: 'GetAxe',
                cost: 1,
                preconditions: [],
                effects: [{ key: 'hasAxe', value: true }]
            },
            {
                name: 'GetWood',
                cost: 1,
                preconditions: [{ key: 'hasAxe', value: true }],
                effects: [
                    { key: 'hasWood', value: true },
                    { key: 'hasAxe', value: true }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            hasAxe: false,
            hasWood: false
        };

        const goal: Goal = {
            name: 'GetWoodGoal',
            conditions: [
                { key: 'hasWood', value: true },
                { key: 'hasAxe', value: true }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(2);
        expect(plan[0].name).toBe('GetAxe');
        expect(plan[1].name).toBe('GetWood');
    });

    test('should handle numeric conditions', () => {
        const action: Action = {
            name: 'NumericAction',
            cost: 1,
            preconditions: [
                { key: 'value', value: 5, operator: 'greaterThan' }
            ],
            effects: [
                { key: 'value', value: (state: WorldState) => state.value - 2 }
            ]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            value: 10
        };

        const goal: Goal = {
            name: 'NumericGoal',
            conditions: [{ key: 'value', value: 6, operator: 'lessThan' }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(3);
        expect(plan[0].name).toBe('NumericAction');
    });

    test('should return empty plan when goal impossible', () => {
        const action: Action = {
            name: 'GetWood',
            cost: 1,
            preconditions: [{ key: 'hasAxe', value: true }],
            effects: [{ key: 'hasWood', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            hasAxe: false,
            hasWood: false
        };

        const goal: Goal = {
            name: 'GetWoodGoal',
            conditions: [{ key: 'hasWood', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(0);
    });

    test('should handle complex conditions', () => {
        const actions: Action[] = [
            {
                name: 'Rest',
                cost: 1,
                preconditions: [
                    { key: 'energy', value: 50, operator: 'lessThan' },
                    { key: 'isResting', value: false }
                ],
                effects: [
                    { key: 'energy', value: 100 },
                    { key: 'isResting', value: true }
                ]
            },
            {
                name: 'StopResting',
                cost: 1,
                preconditions: [
                    { key: 'isResting', value: true },
                    { key: 'energy', value: 90, operator: 'greaterThan' }
                ],
                effects: [
                    { key: 'isResting', value: false }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            energy: 30,
            isResting: false
        };

        const goal: Goal = {
            name: 'RestGoal',
            conditions: [
                { key: 'energy', value: 90, operator: 'greaterThan' },
                { key: 'isResting', value: false }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(2);
        expect(plan[0].name).toBe('Rest');
        expect(plan[1].name).toBe('StopResting');
    });

    test('should handle state transitions with operators', () => {
        const actions: Action[] = [
            {
                name: 'IncrementValue',
                cost: 1,
                preconditions: [],
                effects: [
                    { key: 'value', value: (state: WorldState) => (state.value || 0) + 1 }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = { value: 0 };
        const goal: Goal = {
            name: 'ValueGoal',
            conditions: [{ key: 'value', value: 3, operator: 'greaterThanOrEqual' }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(3);
    });

    test('should handle function-based preconditions', () => {
        const action: Action = {
            name: 'ConditionalAction',
            cost: 1,
            preconditions: [
                {
                    key: 'value',
                    value: (state: WorldState) => state.threshold + 10,
                    operator: 'lessThan'
                }
            ],
            effects: [{ key: 'goal', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            value: 15,
            threshold: 10
        };

        const goal: Goal = {
            name: 'FunctionGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('ConditionalAction');
    });

    test('should handle multiple precondition operators', () => {
        const action: Action = {
            name: 'RangeAction',
            cost: 1,
            preconditions: [
                { key: 'value', value: 5, operator: 'greaterThan' },
                { key: 'value', value: 15, operator: 'lessThan' }
            ],
            effects: [{ key: 'inRange', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = { value: 10 };
        const goal: Goal = {
            name: 'RangeGoal',
            conditions: [{ key: 'inRange', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('RangeAction');
    });

    test('should handle notEquals operator', () => {
        const action: Action = {
            name: 'ChangeState',
            cost: 1,
            preconditions: [
                { key: 'state', value: 'idle', operator: 'notEquals' }
            ],
            effects: [{ key: 'state', value: 'idle' }]
        };

        planner.addAction(action);

        const initialState: WorldState = { state: 'busy' };
        const goal: Goal = {
            name: 'IdleGoal',
            conditions: [{ key: 'state', value: 'idle' }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('ChangeState');
    });

    test('should handle maximum iterations limit', () => {
        const action: Action = {
            name: 'CyclicAction',
            cost: 1,
            preconditions: [],
            effects: [
                { key: 'value', value: (state: WorldState) => state.value + 1 }
            ]
        };

        planner.addAction(action);

        const initialState: WorldState = { value: 0 };
        const goal: Goal = {
            name: 'ImpossibleGoal',
            conditions: [{ key: 'value', value: 2000, operator: 'greaterThan' }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(0);
    });

    test('should handle compound conditions with mixed operators', () => {
        const action: Action = {
            name: 'ComplexAction',
            cost: 1,
            preconditions: [
                { key: 'numeric', value: 10, operator: 'lessThan' },
                { key: 'boolean', value: true },
                { key: 'string', value: 'test', operator: 'equals' }
            ],
            effects: [{ key: 'goal', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            numeric: 5,
            boolean: true,
            string: 'test'
        };

        const goal: Goal = {
            name: 'MixedGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('ComplexAction');
    });

    test('should handle dynamic effects with state dependencies', () => {
        const action: Action = {
            name: 'DynamicEffect',
            cost: 1,
            preconditions: [],
            effects: [
                { key: 'value', value: (state: WorldState) => state.multiplier * 2 },
                { key: 'multiplier', value: (state: WorldState) => state.multiplier }
            ]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            value: 1,
            multiplier: 2
        };

        const goal: Goal = {
            name: 'DynamicEffectGoal',
            conditions: [{ key: 'value', value: 4, operator: 'equals' }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('DynamicEffect');
    });

    test('should handle unreachable states with cycles', () => {
        const actions: Action[] = [
            {
                name: 'ToggleA',
                cost: 1,
                preconditions: [{ key: 'stateB', value: true }],
                effects: [
                    { key: 'stateA', value: (state: WorldState) => !state.stateA },
                    { key: 'stateB', value: false }
                ]
            },
            {
                name: 'ToggleB',
                cost: 1,
                preconditions: [{ key: 'stateA', value: true }],
                effects: [
                    { key: 'stateB', value: (state: WorldState) => !state.stateB },
                    { key: 'stateA', value: false }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            stateA: false,
            stateB: false
        };

        const goal: Goal = {
            name: 'UnreachableGoal',
            conditions: [
                { key: 'stateA', value: true },
                { key: 'stateB', value: true }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(0);
    });

    test('should handle undefined state values', () => {
        const action: Action = {
            name: 'HandleUndefined',
            cost: 1,
            preconditions: [
                { key: 'definedValue', value: true },
                { key: 'undefinedValue', value: undefined, operator: 'equals' }
            ],
            effects: [{ key: 'goal', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            definedValue: true
            // undefinedValue is intentionally missing
        };

        const goal: Goal = {
            name: 'UndefinedGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('HandleUndefined');
    });

    test('should handle invalid action sequences', () => {
        const actions: Action[] = [
            {
                name: 'InvalidAction1',
                cost: 1,
                preconditions: [{ key: 'stateA', value: true }],
                effects: [
                    { key: 'stateB', value: true },
                    { key: 'stateA', value: false }
                ]
            },
            {
                name: 'InvalidAction2',
                cost: 1,
                preconditions: [{ key: 'stateB', value: true }],
                effects: [
                    { key: 'stateC', value: true },
                    { key: 'stateB', value: false }
                ]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            stateA: true,
            stateB: false,
            stateC: false
        };

        const goal: Goal = {
            name: 'InvalidSequenceGoal',
            conditions: [
                { key: 'stateA', value: true },
                { key: 'stateB', value: true },
                { key: 'stateC', value: true }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(0);
    });

    test('should handle dynamic cost with state dependencies', () => {
        const action: Action = {
            name: 'DynamicCostWithState',
            cost: (state: WorldState) => state.resourceA * state.resourceB,
            preconditions: [],
            effects: [{ key: 'goal', value: true }]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            resourceA: 2,
            resourceB: 3
        };

        const goal: Goal = {
            name: 'DynamicCostStateGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('DynamicCostWithState');
    });

    test('should handle multiple goals with same key different operators', () => {
        const action: Action = {
            name: 'RangeAction',
            cost: 1,
            preconditions: [],
            effects: [{ key: 'value', value: 5 }]
        };

        planner.addAction(action);

        const initialState: WorldState = { value: 0 };
        const goal: Goal = {
            name: 'MultiOperatorGoal',
            conditions: [
                { key: 'value', value: 3, operator: 'greaterThan' },
                { key: 'value', value: 7, operator: 'lessThan' }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('RangeAction');
    });

    test('should handle effects that modify multiple dependent states', () => {
        const action: Action = {
            name: 'DependentEffects',
            cost: 1,
            preconditions: [],
            effects: [
                { key: 'baseValue', value: 10 },
                { key: 'multiplier', value: 2 },
                { key: 'result', value: (state: WorldState) => state.baseValue * state.multiplier }
            ]
        };

        planner.addAction(action);

        const initialState: WorldState = {
            baseValue: 0,
            multiplier: 1,
            result: 0
        };

        const goal: Goal = {
            name: 'DependentEffectsGoal',
            conditions: [{ key: 'result', value: 20 }]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan).toHaveLength(1);
        expect(plan[0].name).toBe('DependentEffects');
    });
});
