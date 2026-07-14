import { renderMovementList } from './movements-list.js';

export function renderExpenses(root, ctx) {
  renderMovementList(root, { ...ctx, type: 'expense' });
}
