import { TransitLinesActions } from './transit-lines.actions'
import { initialState, transitLinesReducer } from './transit-lines.reducer'

describe('Transit Lines Reducer', () => {
  test('should select a stop', () => {
    const state = transitLinesReducer(
      initialState,
      TransitLinesActions.SelectStop({ selectedStopId: 'foo' })
    )
    expect(state).toEqual({ ...initialState, selectedStopId: 'foo' })
  })
})
