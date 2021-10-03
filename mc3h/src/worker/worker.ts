import {BackgroundWorker, MESSAGE_TYPE} from "./types";

const ctx: BackgroundWorker = self as any;

ctx.onmessage = event => {
    const msg = event.data;

    switch (msg.type) {
        case MESSAGE_TYPE.REQUEST:
            ctx.postMessage({ type: MESSAGE_TYPE.RESULT, data: "asdf" });
    }
};

ctx.postMessage({ type: MESSAGE_TYPE.READY });