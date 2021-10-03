/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export function utf16ToString(data : ArrayBuffer) : string
{
    const elems = new Uint16Array(data);
    return String.fromCharCode(...elems);
}

export function stringToUTF16(s : string) : ArrayBuffer
{
    let buf = new ArrayBuffer(s.length * 2); // 2 bytes for each char
    let bufView = new Uint16Array(buf);
    const len = s.length;
    for (let i = 0; i < len; i++) 
    {
        bufView[i] = s.charCodeAt(i);
    }
    return buf;
}

export function toBase64(data : ArrayBuffer) : string
{
    const asByteArray = new Uint8Array(data);
    let str = String.fromCharCode(...asByteArray)
    return btoa(str)
}

export function fromBase64(b64 : string) : ArrayBuffer
{
    let str = "";
    try
    {
        str = atob(b64);
    }
    catch (e)
    {
        throw new TypeError("Not a valid base64 string.");
    }

    let buf = new ArrayBuffer(str.length);
    let bufView = new Uint8Array(buf);
    const len = str.length;
    for (let i = 0; i < len; i++)
    {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

export function fromBase64Url(b64url : string) : ArrayBuffer
{
    let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    return fromBase64(b64);
}

export function concatenateBuffers(a : Uint8Array, b : Uint8Array) : Uint8Array
{
    let buf = new Uint8Array(a.length + b.length);
    buf.set(a, 0);
    buf.set(b, a.length);
    return buf;
}

export function concatenateArrayBuffers(a : ArrayBuffer, b : ArrayBuffer) : ArrayBuffer
{
    const buffer_a = new Uint8Array(a);
    const buffer_b = new Uint8Array(b);

    return concatenateBuffers(buffer_a, buffer_b).buffer;
}