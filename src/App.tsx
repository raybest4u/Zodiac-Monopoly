
import React from 'react';
import GameDemo from './game-demo';
import SimpleTest from './simple-test';

function App() {
  // 临时使用简单测试组件
  const useSimpleTest = window.location.search.includes('test');
  
  if (useSimpleTest) {
    return <SimpleTest />;
  }
  
  return (
    <div className="app">
      <GameDemo />
    </div>
  );
}

export default App;