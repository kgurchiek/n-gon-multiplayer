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
let peerRemote = new RTCPeerConnection(config);

peerRemote.onconnectionstatechange = function(e) {
    console.log('peerRemote', 'onconnectionstatechange', e);
};
peerRemote.ondatachannel = function(e) {
    // peerLocal started a data channel, so connect to it here
    console.log('peerRemote', 'ondatachannel', e);
    dcRemote = e.channel;
    dcRemote.onopen = function(e) {
        console.log('dcRemote', 'onopen', e);
        console.log('dcRemote.send("message") to send from remote');

    };
    dcRemote.onmessage = function(e) {
        console.log('dcRemote', 'onmessage', e.data);
    };
    dcRemote.onerror = function(e) {
        console.error('dcRemote', 'onerror', e);
    };
    dcRemote.onclose = function(e) {
        console.log('dcRemote', 'onclose', e);
    };

};
peerRemote.onsignalingstatechange = function(e) {
    console.log('peerRemote', 'onsignalingstatechange', peerRemote.signalingState);
    if (peerRemote.iceGatheringState == 'complete') ws.close();
};
peerRemote.onicegatheringstatechange = function(e) {
    console.log('peerRemote', 'onicegatheringstatechange', peerRemote.iceGatheringState);
};
peerRemote.onicecandidate = function(e){
    //Share ICE candidates with peerLocal
    console.log('peerRemote', 'onicecandidate', e);
    if (e.candidate != null) ws.send(`\x01${JSON.stringify(e.candidate)}`);
};
peerRemote.onnegotiationneeded = function(e) {
    console.log('peerRemote', 'onnegotiationneeded', e);
};

ws = new WebSocket('wss://n-gon.cornbread2100.com');
ws.onopen = async () => {
    console.log('connected');
    ws.send(`\x01${prompt('Join code:')}`)
}
ws.onmessage = async (message) => {
    console.log('message:', message.data, message.data[0] == '\x01')

    if (message.data[0] == '\x00') {
        const peerLocalOffer = new RTCSessionDescription(JSON.parse(message.data.substring(1)));
        console.log('peerRemote', 'setRemoteDescription', peerLocalOffer);
        await peerRemote.setRemoteDescription(peerLocalOffer);

        console.log('peerRemote', 'setRemoteDescription');
        let peerRemoteAnswer = await peerRemote.createAnswer();

        console.log('peerRemote', 'setLocalDescription', peerRemoteAnswer);
        await peerRemote.setLocalDescription(peerRemoteAnswer);
        ws.send(`\x01${JSON.stringify(peerRemoteAnswer)}`);
    }
    if (message.data[0] == '\x01') peerRemote.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data.substring(1))));
    if (message.data[0] == '\x02') console.error(message.data.substring(1));
}
ws.onerror = (err) => {
    console.error(err);
}
ws.onclose = () => {
    console.log('disconnected');
}