import React, {Component} from 'react';
import './index.sass'
import * as tf from '@tensorflow/tfjs';
import * as tfd from '@tensorflow/tfjs-data';
import {ControllerDataset} from '../sub/controller_dataset';

// import * as ui from '../sub/ui';


class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            displaySize: [224, 60],
            displaySub: [
                {id: 'up', title: '基本动作'},
                {id: 'left', title: '动作A'},
                {id: 'right', title: '动作B'},
                {id: 'down', title: '动作C'}
            ],
            modelAct: false,
            trained: false
        }
    }

    render() {
        return (
            <div className={'core'}>
                <div className="display" id={'controller'}>
                    <div className="display-item display-main">
                        <div className="display-inner">
                            <div className="view">
                                <div className="info" id={'status'}>载入模型</div>
                                <div className="info" id={'no-webcam'}/>
                                {/*<canvas></canvas>*/}
                                <video id={'webcam'} style={{opacity: '0.15'}} autoPlay playsInline muted
                                       src="https://ali.image.hellorf.com/images/21bed3696cddb114cee395427211334c.mp4"
                                       width={this.state.displaySize[0]} height={this.state.displaySize[0]}/>
                                {/*<video style={{opacity: '0.0'}} autoPlay playsInline muted id="webcam" width={this.state.displaySize[0]} height={this.state.displaySize[0]} />*/}
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
                                            <canvas id={item.id + '-thumb'} width={this.state.displaySize[1]}
                                                    height={this.state.displaySize[1]}/>
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
                <div className="panel">
                    <div className="panel-groups" onClick={() => {
                        this.setState({modelAct: false, trained: false})
                    }}>

                        {this.state.displaySub.map((button, index) => (
                            <span className={'button'} key={index}>
                                <span style={{display: 'none'}} id={button.id}/>
                                <span onClick={() => {
                                    this.autoClick(button.id, 10)
                                }}>{button.title + '捕捉'}</span>
                            </span>
                        ))}

                        <span className="button">3S延时捕捉<input type="checkbox"/></span>

                    </div>

                    <div className={['panel-button', this.state.trained ? 'act' : ''].join(' ')} id={'train'}
                         onClick={() => {
                             setTimeout(() => {
                                 this.setState({trained: true})
                             }, 1000);
                         }}><span id={'train-status'}>{this.state.trained ? '训练完毕' : '训练模型'}</span><span>训练完毕</span>
                    </div>
                    <div className={['panel-button', this.state.modelAct ? 'act' : ''].join(' ')} id={'predict'}
                         onClick={() => {
                             this.setState({modelAct: true})
                         }}>
                        <span>启动模型</span>
                        <span>已启动</span>
                    </div>
                    <div className="panel-button">保存模型</div>
                </div>
            </div>
        );
    }

    autoClick(id, times) {
        let i = 0;
        let timer = setInterval(() => {
            i++;
            document.getElementById(id).click();
            if (i >= times) clearInterval(timer)
        }, 50)
    }

    componentDidMount() {
        //ui------------------------------------------------------------------------------------------------------------
        const CONTROLS = ['up', 'down', 'left', 'right'];
        const CONTROL_CODES = [38, 40, 37, 39];

        function uiInit() {
            document.getElementById('controller').style.display = '';
            statusElement.style.display = 'none';
        }

        const trainStatusElement = document.getElementById('train-status');

        // Set hyper params from UI values.
        // const learningRateElement = document.getElementById('learningRate');
        const getLearningRate = () => 0.0001; //+learningRateElement.value;

        // const batchSizeFractionElement = document.getElementById('batchSizeFraction');
        const getBatchSizeFraction = () => 0.4;//+batchSizeFractionElement.value;

        // const epochsElement = document.getElementById('epochs');
        const getEpochs = () => 20;//+epochsElement.value;

        // const denseUnitsElement = document.getElementById('dense-units');
        const getDenseUnits = () => 100;//+denseUnitsElement.value;
        const statusElement = document.getElementById('status');

        function startPacman() {
            // google.pacman.startGameplay();
        }

        function predictClass(classId) {
            // google.pacman.keyPressed(CONTROL_CODES[classId]);
            document.body.setAttribute('data-active', CONTROLS[classId]);
        }

        function isPredicting() {
            statusElement.style.visibility = 'visible';
        }

        function donePredicting() {
            statusElement.style.visibility = 'hidden';
        }

        function trainStatus(status) {
            trainStatusElement.innerText = status;
        }

        let addExampleHandler;

        function setExampleHandler(handler) {
            addExampleHandler = handler;
        }

        let mouseDown = false;
        const totals = [0, 0, 0, 0];

        const upButton = document.getElementById('up');
        const downButton = document.getElementById('down');
        const leftButton = document.getElementById('left');
        const rightButton = document.getElementById('right');

        const thumbDisplayed = {};

        async function handler(label) {
            mouseDown = true;
            const className = CONTROLS[label];
            const button = document.getElementById(className);
            const total = document.getElementById(className + '-total');
            while (mouseDown) {
                addExampleHandler(label);
                document.body.setAttribute('data-active', CONTROLS[label]);
                total.innerText = ++totals[label];
                await tf.nextFrame();
            }
            document.body.removeAttribute('data-active');
        }

        // upButton.addEventListener('mousedown', () => handler(0));
        // upButton.addEventListener('mouseup', () => mouseDown = false);
        upButton.addEventListener('click', () => {
            handler(0);
            mouseDown = false;
        });

        // downButton.addEventListener('mousedown', () => handler(1));
        // downButton.addEventListener('mouseup', () => mouseDown = false);
        downButton.addEventListener('click', () => {
            handler(1);
            mouseDown = false;
        });

        // leftButton.addEventListener('mousedown', () => handler(2));
        // leftButton.addEventListener('mouseup', () => mouseDown = false);
        leftButton.addEventListener('click', () => {
            handler(2);
            mouseDown = false;
        });

        // rightButton.addEventListener('mousedown', () => handler(3));
        // rightButton.addEventListener('mouseup', () => mouseDown = false);
        rightButton.addEventListener('click', () => {
            handler(3);
            mouseDown = false;
        });

        function drawThumb(img, label) {
            if (thumbDisplayed[label] == null) {
                const thumbCanvas = document.getElementById(CONTROLS[label] + '-thumb');
                draw(img, thumbCanvas);
            }
        }

        function draw(image, canvas) {
            const [width, height] = [224, 224];
            const ctx = canvas.getContext('2d');
            const imageData = new ImageData(width, height);
            const data = image.dataSync();
            for (let i = 0; i < height * width; ++i) {
                const j = i * 4;
                imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
                imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
                imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
                imageData.data[j + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
        }

        //ui------------------------------------------------------------------------------------------------------------
        //index---------------------------------------------------------------------------------------------------------
        // The number of classes we want to predict. In this example, we will be
        // predicting 4 classes for up, down, left, and right.
        const NUM_CLASSES = 4;

        // A webcam iterator that generates Tensors from the images from the webcam.
        let webcam;

        // The dataset object where we will store activations.
        const controllerDataset = new ControllerDataset(NUM_CLASSES);

        let truncatedMobileNet;
        let model;

        // Loads mobilenet and returns a model that returns the internal activation
        // we'll use as input to our classifier model.
        async function loadTruncatedMobileNet() {
            const mobilenet = await tf.loadLayersModel(
                'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

            // Return a model that outputs an internal activation.
            const layer = mobilenet.getLayer('conv_pw_13_relu');
            return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
        }

        // When the UI buttons are pressed, read a frame from the webcam and associate
        // it with the class label given by the button. up, down, left, right are
        // labels 0, 1, 2, 3 respectively.
        setExampleHandler(async label => {
            let img = await getImage();

            controllerDataset.addExample(truncatedMobileNet.predict(img), label);

            // Draw the preview thumbnail.
            drawThumb(img, label);
            img.dispose();
        })

        /**
         * Sets up and trains the classifier.
         */
        async function train() {
            if (controllerDataset.xs == null) {
                throw new Error('Add some examples before training!');
            }

            // Creates a 2-layer fully connected model. By creating a separate model,
            // rather than adding layers to the mobilenet model, we "freeze" the weights
            // of the mobilenet model, and only train weights from the new model.
            model = tf.sequential({
                layers: [
                    // Flattens the input to a vector so we can use it in a dense layer. While
                    // technically a layer, this only performs a reshape (and has no training
                    // parameters).
                    tf.layers.flatten(
                        {inputShape: truncatedMobileNet.outputs[0].shape.slice(1)}),
                    // Layer 1.
                    tf.layers.dense({
                        units: getDenseUnits(),
                        activation: 'relu',
                        kernelInitializer: 'varianceScaling',
                        useBias: true
                    }),
                    // Layer 2. The number of units of the last layer should correspond
                    // to the number of classes we want to predict.
                    tf.layers.dense({
                        units: NUM_CLASSES,
                        kernelInitializer: 'varianceScaling',
                        useBias: false,
                        activation: 'softmax'
                    })
                ]
            });

            // Creates the optimizers which drives training of the model.
            const optimizer = tf.train.adam(getLearningRate());
            // We use categoricalCrossentropy which is the loss function we use for
            // categorical classification which measures the error between our predicted
            // probability distribution over classes (probability that an input is of each
            // class), versus the label (100% probability in the true class)>
            model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});

            // We parameterize batch size as a fraction of the entire dataset because the
            // number of examples that are collected depends on how many examples the user
            // collects. This allows us to have a flexible batch size.
            const batchSize =
                Math.floor(controllerDataset.xs.shape[0] * getBatchSizeFraction());
            if (!(batchSize > 0)) {
                throw new Error(
                    `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
            }

            // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
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

        isPredicting = false;

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

                predictClass(classId);
                await tf.nextFrame();
            }
            // donePredicting();
        }

        /**
         * Captures a frame from the webcam and normalizes it between -1 and 1.
         * Returns a batched image (1-element batch) of shape [1, w, h, c].
         */
        async function getImage() {
            const img = await webcam.capture();
            const processedImg =
                tf.tidy(() => img.expandDims(0).toFloat().div(127).sub(1));
            img.dispose();
            return processedImg;
        }

        document.getElementById('train').addEventListener('click', async () => {
            trainStatus('Training...');
            await tf.nextFrame();
            await tf.nextFrame();
            isPredicting = false;
            train();
        });
        document.getElementById('predict').addEventListener('click', () => {
            // ui.startPacman();
            isPredicting = true;
            predict();
        });

        async function init() {
            try {
                webcam = await tfd.webcam(document.getElementById('webcam'));
            } catch (e) {
                console.log(e);
                document.getElementById('no-webcam').style.display = 'block';
            }
            truncatedMobileNet = await loadTruncatedMobileNet();

            uiInit();
            // Warm up the model. This uploads weights to the GPU and compiles the WebGL
            // programs so the first time we collect data from the webcam it will be
            // quick.
            const screenShot = await webcam.capture();
            truncatedMobileNet.predict(screenShot.expandDims(0));
            screenShot.dispose();
        }

        // Initialize the application.
        init();
        //index---------------------------------------------------------------------------------------------------------
    }
}

export default Index;
