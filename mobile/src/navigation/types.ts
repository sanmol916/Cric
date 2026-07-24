import type { MatchState } from '../types';

export type RootStackParamList = {
  Tabs: undefined;
  SetupMatch: undefined;
  LiveScoring: undefined;
  Scorecard: { match?: MatchState } | undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};
