import cv2
import time

WIDTH = 640
HEIGHT = 480
FRAMERATE = 24.0
STREAMSOURCE = 'http://192.168.1.24:8000/stream.mjpg'


cap = cv2.VideoCapture(STREAMSOURCE)
fourcc = cv2.VideoWriter_fourcc(*'MJPG')   #avc1  #mp4v  #MP4V  #MPEG  #X264  #H264  #MJPG

# FROM: https://www.pyimagesearch.com/2016/02/22/writing-to-video-with-opencv/
# Things that worked on Windows (for that user)
# – / avi / 112512 kB / I420 / WMP, VLC, Films&TV, MovieMaker
# MJPG / avi / 14115 kB / MJPG / VLC
# MJPG / mp4 / 5111 kB / 6C / VLC
# CVID / avi / 7459 kB / cvid / WMP, VLC, MovieMaker
# MSVC / avi / 83082 kB / CRAM / WMP, VLC
# X264 / avi / 187 kB / H264 / WMP, VLC, Films&TV, MovieMaker
# XVID / avi / 601 kB / XVID / WMP, VLC, MovieMaker
# XVID / mp4 / 587 kB / 20 / WMP, VLC, Films&TV, MovieMaker

# MSVC / avi


out = cv2.VideoWriter('./static/video/{0}.avi'.format(time.strftime('%Y-%m-%d-%H-%M-%S')), fourcc, 32.0, (WIDTH,HEIGHT))

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break
    out.write(frame)

cap.release()
out.release()
cv2.destroyAllWindows()

exit(0)
