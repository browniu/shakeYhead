import React, {Component} from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import './index.scss'
import axios from 'axios'
import $ from 'jquery';
import MD5 from './md5'

export default class Ssd extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            info: null,
            catching: false,
            initState: false,
            result: []
        }
    }

    render() {
        const {initState} = this.state;
        return (
            <div className={['ssd', initState ? '' : 'disable'].join(' ')}>
                {/*{this.state.info && <div className="console">{this.state.info}</div>}*/}
                <div className={['display', this.state.loaded ? 'act' : ''].join(' ')}>
                    <canvas className={this.state.loaded ? 'act' : ''} id={'cvs'}/>
                    <canvas className={this.state.catching ? 'act' : ''} id={'cvsStream'}/>
                    {this.state.catching && <video id={'webcam'} height={320} width={480} autoPlay muted playsInline/>}
                    <img id={'demo'} style={{display: 'none'}} src={require('./plane.jpeg')} alt="demo"/>
                    <div className="static"/>
                </div>
                <div className="panel">
                    <div className="menu">
                        <div className="state">
                            {this.state.result.map(item => <li key={item.class}>
                                <b>{item.class}</b> 概率：<i>{item.score.toFixed(4)}%</i>
                            </li>)}
                        </div>
                        <div className={["button", this.state.catching ? 'act' : ''].join(' ')}
                             onClick={() => this.camSwitch()}>{this.state.catching ? '暂停' : '开始'}</div>
                        <div className="button" onClick={() => this.upload()}><input id={'uploadPic'} type="file"/>上传
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    translate(string = 'apple') {
        const appid = '20191110000355261';
        const key = 'kxd4SUPAKMVXlNp7lwiX';
        const salt = (new Date).getTime();
        const query = string;
        const from = 'en';
        const to = 'zh';
        const str1 = appid + query + salt + key;
        const sign = MD5(str1);
        return $.ajax({
            url: 'https://api.fanyi.baidu.com/api/trans/vip/translate',
            type: 'get',
            dataType: 'jsonp',
            data: {
                q: query,
                appid: appid,
                salt: salt,
                from: from,
                to: to,
                sign: sign
            }
        }).then(res => {
            return res.trans_result[0].dst
        });
    }

    async componentDidMount() {
        this.translate()
        await this.load();
        await this.test();
        this.setState({initState: true})
    }

    async test() {
        const img = document.getElementById('demo');
        const cvs = document.getElementById('cvs');
        const result = await this.ssd.detect(img);
        console.log(result);
        // eslint-disable-next-line no-throw-literal
        if (result.length < 1) throw ('未检测到任何对象');
        else {
            this.translate(result[0].class).then(res => {
                this.setState({result: [{...result[0], class: res}]});
            })
        }
        Ssd.draw(img, result[0], cvs, true);

    }

    async predict(target, type, label) {
        const result = await this.ssd.detect(target);
        if (result.length < 1) {
            this.setState({info: '未检测到任何可识别对象'});
        } else {
            this.translate(result[0].class).then(res => {
                this.setState({result: [{...result[0], class: res}]});
            });
            return result[0]
        }
    }

    async load() {
        this.setState({info: '载入模型中'});
        this.ssd = await cocoSsd.load();
        this.setState({loaded: true, info: null});
    }

    static draw(img, data, container, ifDraw, label) {
        const cvs = container;
        const ctx = cvs.getContext('2d');
        cvs.height = img.height;
        cvs.width = img.width;
        ctx.font = "24px";
        ctx.clearRect(0, 0, cvs.height, cvs.width);
        if (ifDraw) ctx.drawImage(img, 0, 0);

        if (data) {
            const box = data.bbox;
            ctx.fillStyle = "#b9465c66";
            ctx.fillText(label || data.class, box[0], box[1] - 10);
            ctx.fillText(data.score, label ? (label.length + 35 + box[0]) : (data.class.length + 35 + box[0]), box[1] - 10);
            ctx.fillRect(box[0], box[1], box[2], box[3]);
            ctx.fill();
        }
    }

    async webcamSetup() {
        const element = document.getElementById('webcam');
        return new Promise((resolve, reject) => {
            const navigatorAny = navigator;
            navigator.getUserMedia = navigator.getUserMedia || navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia || navigatorAny.msGetUserMedia;
            if (navigator.getUserMedia) {
                navigator.getUserMedia({video: {width: 480, height: 320}}, stream => {
                    this.webcamStop = () => stream.getTracks()[0].stop();
                    element.srcObject = stream;
                    element.addEventListener('loadeddata', () => resolve(), false)
                }, error => reject(error))
            } else reject('摄像设备初始化失败')
        })
    }

    async camSwitch() {
        await this.setState({catching: !this.state.catching});
        if (this.state.catching) {
            await this.webcamSetup();
            let target = document.getElementById('webcam');
            let cvs = document.getElementById('cvsStream');
            this.catch(target, cvs);
            this.setState({info: '汉堡不见了！！！'})

        } else this.webcamStop();
    }

    async catch(target, cvs) {
        let result = await this.predict(target);
        Ssd.draw(target, result, cvs, true);
        if (this.state.catching) requestAnimationFrame(() => this.catch(target, cvs));
    }

    upload() {
        let element = document.getElementById('uploadPic');
        element.onchange = (e) => {
            if (e.target.files[0]) this.reads(e.target.files[0]);
            else {
                this.setState({info: '文件无效'});
                setTimeout(() => {
                    this.setState({info: null})
                }, 3000);
                return
            }
            this.setState({catching: false});
        };
        element.click()
    }

    reads(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const staticEle = document.createElement('img');
            const staticCvs = document.getElementById('cvs');
            const container = document.querySelector('.static');
            staticEle.src = e.target.result;
            staticEle.style.display = 'none';
            // staticCvs.style.width = '100%';
            // staticCvs.className = 'act';
            if (container.childNodes.length > 0) {
                container.removeChild(container.firstChild);
                // container.removeChild(container.lastChild)
            }
            container.appendChild(staticEle);
            // container.appendChild(staticCvs);
            staticEle.onload = async () => {
                if (staticEle.height > 300) staticCvs.setAttribute('style', 'height:300px;width:auto');
                let staticData = await this.predict(staticEle);
                Ssd.draw(staticEle, staticData, staticCvs, true);
            }
        }
    }

}


