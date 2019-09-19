const id = Math.floor(Math.random() * 1000);

console.log(id);

const ws = new WebSocket('wss://cloud.achex.ca');
ws.onopen = () => {
    console.log('ws open');
    const auth = {auth: 'default@890', passowrd: '19861012'};
    ws.send(JSON.stringify(auth));
    (async () => {
        dc = pc.createDataChannel('chat');
        dc.onopen = onDcOpenHandler;
        dc.onmessage = onDcMessageHandler;
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer);
        const json = {id, offer: offer.sdp, to: 'default@890'};
        ws.send(JSON.stringify(json));
    })();
};
ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    if (data.id && data.id !== id) {
        if (data.toId && data.toId === id) {
        console.log(ev, data);
            if (data.answer) {
                (async () => {
                    const answer = new RTCSessionDescription({
                        type: 'answer',
                        sdp: data.answer.sdp
                    });
                    await pc.setRemoteDescription(answer);
                })();
            } else if (data.candidate) {
                const candidate = new RTCIceCandidate({
                    candidate: data.candidate.candidate,
                    sdpMLineIndex: data.candidate.sdpMLineIndex,
                    sdpMid: data.candidate.sdpMid
                });
                (async () => {
                    await pc.addIceCandidate(candidate);
                })();
            }  
        }
    }
};

const pc = new RTCPeerConnection({
    iceServers: [{urls: 'stun:stun.services.mozilla.com:3478'}]
});
pc.onicecandidate = (ev) => {
    console.log(ev);
    const json = {id, candidate: ev.candidate, to: 'default@890'};
    ws.send(JSON.stringify(json));
};
pc.onicegatheringstatechange = (ev) => {
    console.log(ev.currentTarget.iceGatheringState)
};
pc.ondatachannel = (ev) => {
    console.log(ev);
};

let dc = null;
let posls = [];

const onDcOpenHandler = (ev) => {
    console.log(ev);
};

const onDcMessageHandler = (ev) => {
    console.log(ev);
    const data = JSON.parse(ev.data);
    if (data.id === id) {
        return;
    }
    if (data.pos) {
        if (data.pos.x === null || data.pos.y === null) {
            ctx.beginPath();
            let before = {x: null, y: null};
            posls.forEach(e => {
                before = draw(before.x, before.y, e.x, e.y);
            });
            ctx.closePath();
            posls = [];
        } else {
            posls.push(data.pos);
        }
    }
};

let click = false;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const currentColor = '#000000';
let beforePos = {x: null, y: null};
canvas.onmousedown = (ev) => {
    console.log(ev);
    click = true;
    ctx.beginPath();
};
canvas.onmousemove = (ev) => {
    if (click) {
        console.log(ev);
        const x = ev.clientX;
        const y = ev.clientY;
        beforePos = draw(beforePos.x, beforePos.y, x, y);
        const json = {id, pos: {x, y}};
        dc.send(JSON.stringify(json));
    }
};
canvas.onmouseup = (ev) => {
    console.log(ev);
    ctx.closePath();
    click = false;
    beforePos = {x: null, y: null};
    const json = {id, pos: {x: null, y: null}};
    dc.send(JSON.stringify(json));
};

const draw = (beforeX, beforeY, x, y) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = currentColor;
    ctx.moveTo(beforeX || x, beforeY || y);
    ctx.lineTo(x, y);
    ctx.stroke();
    return {x, y};
};