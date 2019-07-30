import React, {Component} from 'react';
import './index.sass'
import * as tf from '@tensorflow/tfjs';
import * as tfd from '@tensorflow/tfjs-data';

class ShakeY extends Component {
    constructor(props) {
        super(props);
        this.config = {
            rate: 30
        }
        this.state = {
            displaySize: [224, 60],
            displaySub: [
                {id: 'up', title: '基本动作'},
                {id: 'left', title: '动作A'},
                {id: 'right', title: '动作B'},
                {id: 'down', title: '动作C'}
            ],
            modelAct: false,
            trained: false,
            delay: false,
            rate: true,
            capturing: false,
            countDown: 0,
            cameraError: false
        }
    }

    render() {
        return (
            <div className={'core'}>
                <div className="display">
                    <div className="display-item display-main">
                        <div className="display-inner">
                            <div className="view">
                                <div className="info" id={'status'}>构建神经网络</div>
                                <div className="info" id={'no-webcam'}>检查输入设备</div>
                                {this.state.delay &&
                                <div className={['info', 'countDown', this.state.countDown ? 'act' : ''].join(' ')}>{this.state.countDown}</div>}
                                <div className="view-content">
                                    <video id={'webcam'} autoPlay playsInline muted width={this.state.displaySize[0]} height={this.state.displaySize[0]} />
                                </div>
                            </div>
                            <div className="title">监控视窗</div>
                        </div>
                    </div>
                    <div className="display-item display-sub">
                        <ul>
                            {this.state.displaySub.map((item, index) => (
                                <li className="display-sub-item" key={index}>
                                    <div className="display-inner" id={'display_' + item.id}>
                                        <div className="view">
                                            <canvas id={item.id + '-thumb'} width={this.state.displaySize[1]} height={this.state.displaySize[1]} />
                                        </div>
                                        <div className="info">
                                            <div className="title">{item.title}</div>
                                            <div className="sub">Train: <span id={item.id + '-total'}>0</span></div>
                                        </div>

                                    </div>
                                </li>
                            ))}
                        </ul>

                    </div>
                </div>
                <div className={['panel', this.state.capturing ? 'disable' : ''].join(' ')} id={'controller'}>
                    <div className="check-groups">
                        <span className="check">
                            <input id={'check_delay'} value={this.state.delay} type="checkbox" onChange={() => {this.setState({delay: !this.state.delay})}} />
                            <label htmlFor="check_delay">延时捕捉</label>
                        </span>
                        <span className="check">
                            <input id={'check_rate'} value={this.state.rate} checked={this.state.rate} type="checkbox" onChange={() => {this.setState({rate: !this.state.rate})}} />
                            <label htmlFor="check_rate">高频捕捉</label>
                        </span>
                    </div>
                    <div className="panel-groups" onClick={() => {
                        this.setState({modelAct: false, trained: false})
                    }}>

                        {this.state.displaySub.map((button, index) => (
                            <span className={'button'} key={index}>
                                <span style={{display: 'none'}} id={button.id} />
                                <span onClick={() => this.capture(button.id, this.state.delay)}>{button.title + '捕捉'}</span>
                            </span>
                        ))}

                    </div>

                    <div className={['panel-button', this.state.trained ? 'act' : ''].join(' ')} id={'train'} onClick={() => {
                        setTimeout(() => {
                            this.setState({trained: true})
                            if (!window.totals.some(e => e > 0)) this.setState({trained: false})
                        }, 1000);
                    }}><span id={'train-status'}>{this.state.trained ? '训练完毕' : '训练模型'}</span><span>训练完毕</span>
                    </div>
                    <div className={['panel-button', this.state.modelAct ? 'act' : '', this.state.trained ? '' : 'disable'].join(' ')} id={'predict'} onClick={() => {
                        if (this.state.trained) this.setState({modelAct: true})
                    }}>
                        <span>启动神经网络</span>
                        <span>已启动</span>
                    </div>
                    <div className={['panel-button', this.state.trained ? '' : 'disable'].join(' ')} id={'save'}>保存模型</div>

                    <div className="panel-button" id={'load'}>载入模型</div>
                </div>
            </div>
        );
    }

    capture(id, isDelay) {
        let delay = 0
        if (isDelay) {
            delay = 3
            this.countdown(delay + 1, 'countDown')
        }
        setTimeout(() => {
            let rate = 10
            if (this.state.rate) rate = this.config.rate
            this.autoClick(id, rate, delay)
        }, 1000)
    }

    countdown(count, output) {
        let timer = setInterval(() => {
            count--
            this.setState({[output]: count})
            if (count <= 0) clearInterval(timer)
        }, 1000)
    }

    autoClick(id, rate, delay) {
        this.setState({capturing: true})
        setTimeout(() => {
            let i = 0;
            let timer = setInterval(() => {
                i++;
                document.getElementById(id).click();
                if (i >= rate) {
                    clearInterval(timer)
                    this.setState({capturing: false})
                }
            }, 20)
        }, delay * 1000)
    }


    componentDidMount() {
        // 构造器--------------------------------------------------------------------------------------------------------
        class ControllerDataset {
            constructor(numClasses) {
                this.numClasses = numClasses;
            }

            addExample(example, label) {
                const y = tf.tidy(
                    () => tf.oneHot(tf.tensor1d([label]).toInt(), this.numClasses));

                if (this.xs == null) {
                    this.xs = tf.keep(example);
                    this.ys = tf.keep(y);
                } else {
                    const oldX = this.xs;
                    this.xs = tf.keep(oldX.concat(example, 0));

                    const oldY = this.ys;
                    this.ys = tf.keep(oldY.concat(y, 0));

                    oldX.dispose();
                    oldY.dispose();
                    y.dispose();
                }
            }
        }

        // 常量---------------------------------------------------------------------------------------------------------
        const that = this
        const CONTROLS = ['up', 'down', 'left', 'right'];
        const NUM_CLASSES = 4;
        let totals = [0, 0, 0, 0];
        const controllerDataset = new ControllerDataset(NUM_CLASSES);
        const thumbDisplayed = {};
        const getLearningRate = () => 0.0001;
        const getBatchSizeFraction = () => 0.4;
        const getEpochs = () => 30;
        const getDenseUnits = () => 30;

        const statusElement = document.getElementById('status');
        const trainStatusElement = document.getElementById('train-status');
        const upButton = document.getElementById('up');
        const downButton = document.getElementById('down');
        const leftButton = document.getElementById('left');
        const rightButton = document.getElementById('right');


        // 变量---------------------------------------------------------------------------------------------------------
        let webcam;
        let mouseDown = false;
        let addExampleHandler;
        let model;
        let truncatedMobileNet;
        let isPredicting = false;
        let isLoadModel = false
        // 全局暴露
        window.totals = totals

        // 方法---------------------------------------------------------------------------------------------------------
        // 获取图像数据
        async function getImage() {
            const img = await webcam.capture();
            const processedImg =
                tf.tidy(() => img.expandDims(0).toFloat().div(127).sub(1));
            img.dispose();
            return processedImg;
        }

        // 合成数据集
        function setExampleHandler(handler) {
            addExampleHandler = handler;
        }

        // 捕捉处理
        async function handler(label) {
            mouseDown = true;
            const className = CONTROLS[label];
            const total = document.getElementById(className + '-total');
            while (mouseDown) {
                addExampleHandler(label);
                document.body.setAttribute('data-active', CONTROLS[label]);
                total.innerText = ++totals[label];
                await tf.nextFrame();
            }
            document.body.removeAttribute('data-active');
        }

        // 捕捉绘制
        function drawThumb(img, label) {
            if (thumbDisplayed[label] == null) {
                const thumbCanvas = document.getElementById(CONTROLS[label] + '-thumb');
                const [width, height] = [224, 224];
                const ctx = thumbCanvas.getContext('2d');
                const imageData = new ImageData(width, height);
                const data = img.dataSync();
                for (let i = 0; i < height * width; ++i) {
                    const j = i * 4;
                    imageData.data[j] = (data[i * 3] + 1) * 127;
                    imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
                    imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
                    imageData.data[j + 3] = 255;
                }
                ctx.putImageData(imageData, 0, 0);
            }
        }

        // 模型迁移应用
        async function loadTruncatedMobileNet() {
            const mobilenet = await tf.loadLayersModel(
                'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
            // 返回一个卷积层作为激活器
            const layer = mobilenet.getLayer('conv_pw_13_relu');
            return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
        }

        // 建立模型
        async function getModel() {
            if (isLoadModel) {
                model = await tf.loadLayersModel('http:localhost/model/modelName.json')
            } else {
                // 创建一个包含两个全链接层的模型
                model = tf.sequential({
                    layers: [
                        // 展开数据
                        tf.layers.flatten(
                            {inputShape: truncatedMobileNet.outputs[0].shape.slice(1)}),
                        // 全连接层1
                        tf.layers.dense({
                            units: getDenseUnits(),
                            activation: 'relu',
                            kernelInitializer: 'varianceScaling',
                            useBias: true
                        }),
                        // 全链接层2-输出层
                        tf.layers.dense({
                            units: NUM_CLASSES,
                            kernelInitializer: 'varianceScaling',
                            useBias: false,
                            activation: 'softmax'
                        })
                    ]
                });
                // 创建一个优化器
                const optimizer = tf.train.adam(getLearningRate());
                // 编译模型
                model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
            }
        }

        // 训练模型
        async function train() {
            if (controllerDataset.xs == null) {
                alert('捕捉一些画面后进行训练')
                return
            }
            await getModel()
            // 轮栈大小
            const batchSize =
                Math.floor(controllerDataset.xs.shape[0] * getBatchSizeFraction());
            if (!(batchSize > 0)) {
                throw new Error(
                    `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
            }
            // 训练模型
            model.fit(controllerDataset.xs, controllerDataset.ys, {
                batchSize,
                epochs: getEpochs(),
                callbacks: {
                    onBatchEnd: async (batch, logs) => {
                        trainStatus('Loss: ' + logs.loss.toFixed(5));
                    }
                }
            });
        }

        // 事件监听
        function listener(_this) {
            let that = _this;
            [upButton, downButton, leftButton, rightButton].map((button, index) => button.addEventListener(('click'), () => {
                handler(index);
                mouseDown = false
            }))
            document.getElementById('train').addEventListener('click', async () => {
                trainStatus('Training...');
                await tf.nextFrame();
                await tf.nextFrame();
                isPredicting = false;
                train();
            });
            document.getElementById('predict').addEventListener('click', () => {
                if (that.state.trained) {
                    isPredicting = true;
                    predict();
                } else {
                    alert('未经训练')
                }
            });

            document.getElementById('save').addEventListener("click", () => saveModel())
        }

        // 训练状态
        function trainStatus(status) {
            trainStatusElement.innerText = status;
        }

        // 预测
        async function predict() {
            // isPredicting();
            while (isPredicting) {
                // Capture the frame from the webcam.
                const img = await getImage();

                // Make a prediction through mobilenet, getting the internal activation of
                // the mobilenet model, i.e., "embeddings" of the input images.
                const embeddings = truncatedMobileNet.predict(img);

                // Make a prediction through our newly-trained model using the embeddings
                // from mobilenet as input.
                const predictions = model.predict(embeddings);

                // Returns the index with the maximum probability. This number corresponds
                // to the class the model thinks is the most probable given the input.
                const predictedClass = predictions.as1D().argMax();
                const classId = (await predictedClass.data())[0];
                img.dispose();

                document.body.setAttribute('data-active', CONTROLS[classId]);
                await tf.nextFrame();
            }
            // donePredicting();
        }

        // 初始化
        async function init() {
            try {
                webcam = await tfd.webcam(document.getElementById('webcam'));
            } catch (e) {
                console.log(e);
                document.getElementById('no-webcam').style.display = 'block';
            }
            truncatedMobileNet = await loadTruncatedMobileNet();

            document.getElementById('controller').style.display = 'block';
            statusElement.style.display = 'none';
            // Warm up the model. This uploads weights to the GPU and compiles the WebGL
            // programs so the first time we collect data from the webcam it will be
            // quick.
            if (webcam) {
                const screenShot = await webcam.capture();
                truncatedMobileNet.predict(screenShot.expandDims(0));
                screenShot.dispose();
            } else {
                document.getElementById('controller').style.display = 'none';
            }
        }

        // 保存模型
        async function saveModel() {
            await model.save('localstorage://shakeYhead')
        }

        // 载入模型
        async function loadModel() {

        }

        // 执行---------------------------------------------------------------------------------------------------------
        // 合成数据集
        setExampleHandler(async label => {
            let img = await getImage();

            controllerDataset.addExample(truncatedMobileNet.predict(img), label);

            // Draw the preview thumbnail.
            drawThumb(img, label);
            img.dispose();
        })

        // 事件监听
        listener(this)

        // 初始化
        init()

    }
}

export default ShakeY;
