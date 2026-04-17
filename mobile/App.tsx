import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { paperTheme } from './src/theme/paperTheme';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PaperProvider theme={paperTheme}>
        <RootNavigator />
      </PaperProvider>
    </Provider>
  );
}

export default App;
