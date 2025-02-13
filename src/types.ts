/**
 * Represents the current state of the world as key-value pairs
 */
export interface WorldState {
  [key: string]: any;
}

/**
 * Defines a condition that must be met before an action can be performed
 */
export interface ActionPrecondition {
  /** The state key to check */
  key: string;
  /** The value to compare against */
  value: any;
  /** The comparison operator to use. Defaults to 'equals' if not specified */
  operator?:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual';
}

/**
 * Defines how an action changes the world state
 */
export interface ActionEffect {
  /** The state key to modify */
  key: string;
  /** The new value to set */
  value: any;
}

/**
 * Represents an action that can be performed in the world
 */
export interface Action {
  /** The name of the action */
  name: string;
  /**
   * The cost of performing this action
   * Can be a fixed number or a function that calculates the cost based on the current state
   */
  cost: number | ((state: WorldState) => number);
  /** Conditions that must be satisfied before the action can be performed */
  preconditions: ActionPrecondition[];
  /** Changes to the world state that occur when the action is performed */
  effects: ActionEffect[];
  /** Optional function to execute when the action is performed */
  execute?: () => Promise<void> | void;
}

/**
 * Represents a goal that the planner tries to achieve
 */
export interface Goal {
  /** The name of the goal */
  name: string;
  /** Conditions that must be satisfied for the goal to be considered achieved */
  conditions: ActionPrecondition[];
  /** Optional priority value for the goal. Higher values indicate higher priority */
  priority?: number;
}
