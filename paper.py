import os
import cv2
import numpy as np
from os import listdir

import time
import math
import matplotlib
import matplotlib.pyplot as plt
import scipy.cluster.hierarchy as hcluster
import json
import ctypes
from copy import deepcopy
from websocket_server import WebsocketServer
import threading
import asyncio
import websockets


matplotlib.rcParams['figure.figsize'] = (20.0, 18.0)

# TODO: set rotation parameter, compare with parameter and add/substract difference
area = 145
circ = 60
inert = 55
conv = 0
areamin = 140
area = 260
circ = 0.6
inert = 0.55
diceArray = list()


def socketSetup():
    PORT = 9001
    server = WebsocketServer(PORT)
    server.set_fn_message_received(msgReceived)
    server.run_forever()


def msgReceived(client, server, message):
    server.send_message_to_all(message)


async def dumpSocket(msg):
    uri = "ws://localhost:9001"
    async with websockets.connect(uri) as websocket:
        await websocket.send(msg)


def ctype_async_raise(thread_obj, exception):
    found = False
    target_tid = 0
    for tid, tobj in threading._active.items():
        if tobj is thread_obj:
            found = True
            target_tid = tid
            break

    if not found:
        raise ValueError("Invalid thread object")

    ret = ctypes.pythonapi.PyThreadState_SetAsyncExc(
        target_tid, ctypes.py_object(exception))
    # ref: http://docs.python.org/c-api/init.html#PyThreadState_SetAsyncExc
    if ret == 0:
        raise ValueError("Invalid thread ID")
    elif ret > 1:
        # Huh? Why would we notify more than one threads?
        # Because we punch a hole into C level interpreter.
        # So it is better to clean up the mess.
        ctypes.pythonapi.PyThreadState_SetAsyncExc(target_tid, NULL)
        raise SystemError("PyThreadState_SetAsyncExc failed")
    print("Successfully set asynchronized exception for", target_tid)


def on_trackbarcon(val):
    global area
    area = val


def on_trackbarareamin(val):
    global areamin
    areamin = val


def on_trackbarcir(val):
    global circ
    circ = val/100


def on_trackbarine(val):
    global inert
    inert = val/100


def on_trackbarconv(val):
    global conv
    conv = val/100


def tracks():
    global area
    global areamin
    global circ
    global conv
    global inert
    tracks = 100, 100, 3
    cv2.namedWindow("tracks", cv2.WINDOW_NORMAL)
    cv2.imshow("tracks", tracks)
    cv2.moveWindow("tracks", 1200, 200)
    cv2.createTrackbar("area", "tracks", area, 300, on_trackbarcon)
    cv2.createTrackbar("areamin", "tracks", areamin, 300, on_trackbarareamin)
    cv2.createTrackbar("circ", "tracks", circ, 100, on_trackbarcir)
    cv2.createTrackbar("conv", "tracks", conv, 100, on_trackbarconv)
    cv2.createTrackbar("inert", "tracks", inert, 100, on_trackbarine)
    areamin = 50
    area = 145
    circ = 0.6
    inert = 0.55


def get_numbers_in_between(l, x, y):
    ret = list()
    for p in l:
        if int(p[0]) in range(int(min(x[0], y[0])), int(max(x[0], y[0]))):
            if int(p[1]) in range(int(min(x[1], y[1])), int(max(x[1], y[1]))):
                ret.append(p)
    return ret


def getRotation(points):
    contours = list()
    contours.append(np.array(points[0], dtype=np.int32))
    # drawing = np.zeros([900, 900], np.uint8)
    # drawing = cv2.cvtColor(drawing, cv2.COLOR_GRAY2BGR)
    # for cnt in contours:
    #     cv2.drawContours(drawing, [cnt], 0, (255, 255, 255), 2)

    # rect = cv2.boundingRect(contours[0])
    # cv2.rectangle(drawing, (rect[0], rect[1]),
    #               (rect[0]+rect[2], rect[1]+rect[3]), (255, 0, 255), 2)
    rect = cv2.minAreaRect(contours[0])
    # box = cv2.boxPoints(rect)
    # box = np.int0(box)
    # cv2.drawContours(drawing, [box], 0, (0, 0, 255), 2)
    # cv2.imshow('output', drawing)
    return np.round(rect[2])


def calculateAngle(angle, angleNew, angleOld):
    if angleOld > angleNew:
        delta = -((max(angleNew, angleOld) - min(angleNew, angleOld)) % 90)
    if angleOld < angleNew:
        delta = ((max(angleNew, angleOld) - min(angleNew, angleOld)) % 90)
    if angleOld == angleNew:
        delta = 0
    # delta = abs(angleOld % 90) - abs(angleNew % 90)
    angle = (angle + delta) % 360
    angleOld = angleNew

    return angle, angleOld


# def heightmap(value, point):
#     hMap = np.zeros((1000, 1000, 3), np.uint8)
#     hMap = cv2.cvtColor(hMap, cv2.COLOR_BGR2GRAY)

#     color = 42*(value-6)
#     hMap = cv2.circle(hMap, (np.int(point[0]), np.int(
#         point[1])), np.int(value*20), (255), -1, cv2.LINE_AA)
#     out = cv2.distanceTransform(hMap, cv2.DIST_L2, 5)
#     out = cv2.normalize(out, out, 0, 1.0, cv2.NORM_MINMAX)
#     colors = []
#     for c in out:
#         for c2 in c:
#             colors.append(c2)
#     return colors


# 10 frames da sein zu aufnahme in dice array
def addToDice(pip, points):
    global diceArray
    angle = getRotation(points)
    # print(angle)
    points = np.average(points[0], axis=0)
    # if filtered is empty, die is not included yet
    filtered = get_numbers_in_between(
        [d["points"] for d in diceArray], points+15, points-15)
    if not filtered:
        diceArray.append({"pips": pip, "points": points.tolist(
        ), "angle": 0, "angleOld": 0, "seen": 0, "stay": 0, "id": "dice"+str(addToDice.id), "map": 0})
        addToDice.id += 1
    else:
        for d in diceArray:
            if (d["points"] == filtered[0]):
                d["points"] = np.average(
                    [filtered[0], d["points"]], axis=0).tolist()
                d["pips"] = np.average([pip, d["pips"]])
                d["seen"] = 0
                d["stay"] = d["stay"] + 1
                d["angle"], d["angleOld"] = calculateAngle(
                    d["angle"], angle, d["angleOld"])
                # if (d["pips"] > 6):
                #     d["map"] = heightmap(d["pips"], d["points"])
    pass


# def writeToFile():
    # outputArray = deepcopy(diceArray)
    # # for x in diceArray:
    # #     outputArray.append(x)
    # for x in outputArray:
    #     x["pips"] = int(np.round(x["pips"]))
    #     x["points"] = list((x["points"][0]/10-45, x["points"][1]/10-45))
    # output = json.dumps(outputArray)
    # with open("../threejs/obj/dice.json", "w", encoding="utf-8") as f:
    #     f.write(output)


def writeToSocket():
    outputArray = deepcopy(diceArray)
    # for x in diceArray:
    #     outputArray.append(x)
    outputArray = [x for x in outputArray if x["stay"] > 10]
    for x in outputArray:
        x["pips"] = int(np.round(x["pips"]))
        x["points"] = list(
            np.round((x["points"][0]/10-75, x["points"][1]/10-75)))
        del x["seen"]
        del x["stay"]
        del x["angleOld"]
    output = json.dumps(outputArray)
    # clientSocket.send(output.encode())
    asyncio.set_event_loop(asyncio.new_event_loop())
    asyncio.get_event_loop().run_until_complete(dumpSocket(output))
    asyncio.get_event_loop().stop()
    asyncio.get_event_loop().close()


def detect_pips_and_locations(captured_frames):
    """ function to detect the pips on the top face
    and location of each die

    input: list of frames
    output: plot of each frame with detected pips and number of pips
    """
    global diceArray

    gray_image = captured_frames
    # x_range1 = int(gray_image.shape[0]*0.06)
    # x_range2 = int(gray_image.shape[0]*0.91)
    # y_range1 = int(gray_image.shape[1]*0.05)
    # y_range2 = int(gray_image.shape[1]*0.95)

    # # cropping out the outer border
    # gray_image[:,0:y_range1] = 0.0
    # gray_image[:,y_range2:] = 0.0
    # gray_image[:x_range1,:] = 0.0
    # gray_image[x_range2:,:] = 0.0

    # plt.figure(figsize=(20,18))

    # setting the parameters for the blob_detection function of OpenCV
    min_threshold = 150
    max_threshold = 255
    min_area = areamin
    max_area = area
    min_circularity = circ
    min_inertia_ratio = inert

    params = cv2.SimpleBlobDetector_Params()
    params.filterByColor = True
    params.filterByConvexity = True
    params.filterByArea = True
    params.filterByCircularity = True
    params.filterByInertia = True
    params.minThreshold = min_threshold
    params.maxThreshold = max_threshold
    params.minArea = min_area
    params.maxArea = max_area
    params.minCircularity = min_circularity
    params.minConvexity = conv
    params.minInertiaRatio = min_inertia_ratio
    params.minDistBetweenBlobs = 2

    detector = cv2.SimpleBlobDetector_create(params)
    keypoints = detector.detect(gray_image)
    inv_image = cv2.bitwise_not(gray_image)
    keypoints2 = detector.detect(inv_image)
    im_with_keypoints = cv2.drawKeypoints(gray_image, keypoints+keypoints2, np.array(
        []), (0, 0, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)

    thresh = 65  # 38, 50
    X = np.array([list(i.pt) for i in keypoints+keypoints2])

    if len(X) > 1:
        clusters = hcluster.fclusterdata(X, thresh, criterion="distance")
        cluster_no = [np.sum(clusters == i) for i in clusters]
        num_dict = {np.where(clusters == i)[0][0]: np.sum(
            clusters == i) for i in np.unique(clusters)}
        key_map = {i: {np.sum(clusters == i): [
            X[np.where(np.array(clusters) == i)[0]]]} for i in np.unique(clusters)}
        num = 0
        for i, v in key_map.items():
            for j, k in v.items():
                addToDice(j, k)
                # cv2.putText(im_with_keypoints, str(np.round(diceArray[num]["pips"])), (int(
                #     k[0][0][0])+35, int(k[0][0][1])+18), cv2.FONT_HERSHEY_PLAIN, 3, (0, 255, 0), 2)
                num = num + 1
        # for d in diceArray:
        #     print(d["seen"])
    for d in diceArray:
        d["seen"] = d["seen"] + 1
    diceArray = [x for x in diceArray if not x["seen"] >= 10]
    cv2.imshow("w", im_with_keypoints)


cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1000)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1000)
cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
ret, frame = cap.read()
cv2.imshow("w", frame)
cv2.moveWindow("w", 200, 50)

serverThread = threading.Thread(target=socketSetup, daemon=True)
serverThread.start()

# tracks()
writeCount = 0
addToDice.id = 0

while True:
    ret, frame = cap.read()
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # frame = cv2.GaussianBlur(frame,(1,1),0)
    frame = cv2.threshold(frame, 65, 255, cv2.THRESH_BINARY)[1]
    # cv2.imshow("gauss",frame)
    kernel = np.ones((5, 5), np.uint8)
    # frame = cv2.erode(frame, kernel, iterations=1)
    # cv2.imshow("erode",frame)
    detect_pips_and_locations(frame)
    writeCount = writeCount + 1
    if writeCount > 5:
        writeCount = 0
        # writeToFile()
        write = threading.Thread(target=writeToSocket)
        write.start()

    res = cv2.waitKey(1)
    if res & 0xFF == ord('q'):
        ctype_async_raise(serverThread, "KeyboardInterrupt")
        break
