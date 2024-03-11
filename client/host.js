let dcLocal = null;
let dcRemote = null;
const config = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ]
}
let peerLocal = new RTCPeerConnection(config);

peerLocal.onconnectionstatechange = function(e) {
    console.log('peerLocal', 'onconnectionstatechange', e);
};
peerLocal.ondatachannel = function(e) {
    console.log('peerLocal', 'ondatachannel', e);
};
peerLocal.onsignalingstatechange = function(e) {
    console.log('peerLocal', 'onsignalingstatechange', peerLocal.signalingState);
};
peerLocal.onicegatheringstatechange = function(e) {
    console.log('peerLocal', 'onicegatheringstatechange', peerLocal.iceGatheringState);
    if (peerLocal.iceGatheringState == 'complete') ws.close();
};
peerLocal.onicecandidate = function(e){
    console.log('peerLocal', 'onicecandidate', e.candidate);
    //Share ICE candidates with peerRemote
    console.log('candidate', e.candidate)
    if (e.candidate != null) ws.send(`\x00${JSON.stringify(e.candidate)}`);
};
peerLocal.onnegotiationneeded = function(e) {
    console.log('peerLocal', 'onnegotiationneeded', e);
};
dcLocal = peerLocal.createDataChannel('rtcdc');
dcLocal.onopen = function(e) {
    console.log('dcLocal', 'onopen', e);
    console.log('dcLocal.send("message") to send from server');
};
dcLocal.onmessage = function(e) {
    console.log('dcLocal', 'onmessage', e.data);
};
dcLocal.onerror = function(e) {
    console.error('dcLocal', 'onerror', e);
};
dcLocal.onclose = function(e) {
    console.log('dcLocal', 'onclose', e);
};

(async () => {
    console.log('peerLocal', 'createOffer');
    let peerLocalOffer = await peerLocal.createOffer();

    ws = new WebSocket('wss://n-gon.cornbread2100.com');
    ws.onopen = async () => {
        console.log('connected');
        ws.send(`\x00${JSON.stringify(peerLocalOffer)}`);
    }
    let state = 0;
    ws.onmessage = async (message) => {
        console.log('message:', message.data)

        if (message.data[0] == '\x00') {
            if (state == 0) {
                alert(`Join code: ${message.data.substring(1)}\nPress "ok" before entring it on another device.`);
                state++;
            } else {
                const peerRemoteAnswer = new RTCSessionDescription(JSON.parse(message.data.substring(1)));
                console.log('peerLocal', 'setLocalDescription', peerLocalOffer);
                await peerLocal.setLocalDescription(peerLocalOffer);
                console.log('peerLocal', 'setRemoteDescription', peerRemoteAnswer);
                await peerLocal.setRemoteDescription(peerRemoteAnswer);
            }
        }
        if (message.data[0] == '\x01') peerLocal.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data.substring(1))));
        if (message.data[0] == '\x02') console.error(message.data.substring(1));
    }
    ws.onerror = (err) => {
        console.error(err);
    }
    ws.onclose = () => {
        console.log('disconnected');
    }
})();