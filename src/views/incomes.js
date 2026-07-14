import { renderMovementList } from './movements-list.js';

export function renderIncomes(root, ctx) {
  renderMovementList(root, { ...ctx, type: 'income' });
}
