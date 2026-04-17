import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PaperProvider>
        <RootNavigator />
      </PaperProvider>
    </Provider>
  );
}

export default App;
