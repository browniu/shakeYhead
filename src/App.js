import React, {Component} from 'react';
import Core from './components/core/index'
import Pose from './components/pose/index'
import Ssd from './components/ssd/index'
import './index.scss'

class App extends Component {
    constructor(props) {
        super(props);
        this.list = ['分类器训练', '姿势识别', '物品识别'];
        this.state = {
            index: null
        }
    }

    render() {
        return (
            <div className="App">
                {!this.state.index ? <div className="main-panel">
                        <div className="title">
                            <h3>Browniu-机器学习相关</h3>
                        </div>
                        <div className="menu">
                            {this.list.map((e, i) => (
                                <li key={i} onClick={() => this.setState({index: i + 1})}>{e}</li>
                            ))}
                        </div>
                    </div> :
                    <div className="main-display">
                        <div className="back" onClick={() => this.setState({index: 0})}/>
                        {this.state.index === 1 && <Core/>}
                        {this.state.index === 2 && <Pose/>}
                        {this.state.index === 3 && <Ssd/>}
                    </div>}

            </div>
        );
    }
}

export default App;
