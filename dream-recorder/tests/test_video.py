import pytest
from unittest import mock
from functions import video

@pytest.fixture
def mock_config(monkeypatch):
    monkeypatch.setattr(video, 'get_config', lambda: {
        'FFMPEG_BRIGHTNESS': 0.1,
        'FFMPEG_VIBRANCE': 0.2,
        'FFMPEG_DENOISE_THRESHOLD': 0.3,
        'FFMPEG_BILATERAL_SIGMA': 0.4,
        'FFMPEG_NOISE_STRENGTH': 0.5,
        'THUMBS_DIR': '/tmp',
        'LUMA_GENERATIONS_ENDPOINT': 'http://fake/api',
        'LUMALABS_API_KEY': 'fake-key',
        'LUMA_MODEL': 'model',
        'LUMA_RESOLUTION': 'res',
        'LUMA_DURATION': 1,
        'LUMA_ASPECT_RATIO': '1:1',
        'LUMA_MAX_POLL_ATTEMPTS': 1,
        'LUMA_POLL_INTERVAL': 0.01,
        'LUMA_API_URL': 'http://fake/api',
        'VIDEOS_DIR': '/tmp',
    })

@pytest.fixture
def mock_logger():
    return mock.Mock()

def test_process_video_success(monkeypatch, mock_config, mock_logger):
    monkeypatch.setattr(video.ffmpeg, 'input', lambda x: x)
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p: (s, p))
    monkeypatch.setattr(video.ffmpeg, 'run', lambda *a, **k: None)
    monkeypatch.setattr(video.shutil, 'move', lambda src, dst: None)
    result = video.process_video('input.mp4', logger=mock_logger)
    assert result == 'input.mp4'
    mock_logger.info.assert_called()

def test_process_video_error(monkeypatch, mock_config, mock_logger):
    monkeypatch.setattr(video.ffmpeg, 'input', lambda x: x)
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p: (s, p))
    def raise_exc(*a, **k): raise Exception('ffmpeg fail')
    monkeypatch.setattr(video.ffmpeg, 'run', raise_exc)
    with pytest.raises(Exception):
        video.process_video('input.mp4', logger=mock_logger)
    mock_logger.error.assert_called()

def test_process_video_logs_error(monkeypatch, mock_config, mock_logger):
    monkeypatch.setattr(video.ffmpeg, 'input', lambda x: x)
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p: (s, p))
    def raise_exc(*a, **k): raise Exception('fail')
    monkeypatch.setattr(video.ffmpeg, 'run', raise_exc)
    with pytest.raises(Exception):
        video.process_video('input.mp4', logger=mock_logger)
    assert any('Error processing video' in str(c[0][0]) for c in mock_logger.error.call_args_list)

def test_process_video_error_no_logger(monkeypatch, mock_config):
    monkeypatch.setattr(video.ffmpeg, 'input', lambda x: x)
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p: (s, p))
    def raise_exc(*a, **k): raise Exception('fail')
    monkeypatch.setattr(video.ffmpeg, 'run', raise_exc)
    with pytest.raises(Exception):
        video.process_video('input.mp4', logger=None)

def test_process_video_exception(monkeypatch, mock_config, mock_logger):
    monkeypatch.setattr(video.ffmpeg, 'input', lambda x: x)
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p: (s, p))
    monkeypatch.setattr(video.ffmpeg, 'run', lambda *a, **k: None)
    def raise_exc(*a, **k): raise Exception('move fail')
    monkeypatch.setattr(video.shutil, 'move', raise_exc)
    with pytest.raises(Exception):
        video.process_video('input.mp4', logger=mock_logger)
    mock_logger.error.assert_called()

def test_process_thumbnail_success(monkeypatch, mock_config, mock_logger):
    fake_probe = {'streams': [{'codec_type': 'video', 'width': 100, 'height': 80}]}
    monkeypatch.setattr(video.ffmpeg, 'probe', lambda x: fake_probe)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video.ffmpeg, 'input', lambda *a, **k: 'stream')
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p, vframes: (s, p, vframes))
    monkeypatch.setattr(video.ffmpeg, 'run', lambda *a, **k: None)
    result = video.process_thumbnail('video.mp4', logger=mock_logger)
    assert result.startswith('thumb_') and result.endswith('.png')
    mock_logger.info.assert_called()

def test_process_thumbnail_ffmpeg_error(monkeypatch, mock_config, mock_logger):
    fake_probe = {'streams': [{'codec_type': 'video', 'width': 100, 'height': 80}]}
    monkeypatch.setattr(video.ffmpeg, 'probe', lambda x: fake_probe)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video.ffmpeg, 'input', lambda *a, **k: 'stream')
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p, vframes: (s, p, vframes))
    class FakeFFmpegError(video.ffmpeg.Error):
        def __init__(self):
            self.stderr = b'fail'
    def raise_ffmpeg(*a, **k): raise video.ffmpeg.Error('fail', b'fail', b'fail')
    monkeypatch.setattr(video.ffmpeg, 'run', raise_ffmpeg)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=mock_logger)
    mock_logger.error.assert_called()

def test_process_thumbnail_logs_error(monkeypatch, mock_config, mock_logger):
    def raise_exc(*a, **k): raise Exception('fail')
    monkeypatch.setattr(video.ffmpeg, 'probe', raise_exc)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=mock_logger)
    assert any('Error generating thumbnail' in str(c[0][0]) for c in mock_logger.error.call_args_list)

def test_process_thumbnail_error_no_logger(monkeypatch, mock_config):
    def raise_exc(*a, **k): raise Exception('fail')
    monkeypatch.setattr(video.ffmpeg, 'probe', raise_exc)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=None)

def test_process_thumbnail_ffmpeg_error_block(monkeypatch, mock_config, mock_logger):
    fake_probe = {'streams': [{'codec_type': 'video', 'width': 100, 'height': 80}]}
    monkeypatch.setattr(video.ffmpeg, 'probe', lambda x: fake_probe)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video.ffmpeg, 'input', lambda *a, **k: 'stream')
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p, vframes: (s, p, vframes))
    class FakeFFmpegError(video.ffmpeg.Error):
        def __init__(self):
            self.stderr = b'fail'
    def raise_ffmpeg(*a, **k): raise video.ffmpeg.Error('fail', b'fail', b'fail')
    monkeypatch.setattr(video.ffmpeg, 'run', raise_ffmpeg)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=mock_logger)
    mock_logger.error.assert_called()

def test_process_thumbnail_outer_exception(monkeypatch, mock_config, mock_logger):
    def raise_exc(*a, **k): raise Exception('outer fail')
    monkeypatch.setattr(video.ffmpeg, 'probe', raise_exc)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=mock_logger)
    mock_logger.error.assert_called()

def test_generate_video_success(monkeypatch, mock_config, mock_logger):
    # Patch requests.post and requests.get
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.return_value = {'id': 'genid'}
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    fake_get = mock.Mock()
    fake_get.status_code = 200
    fake_get.json.return_value = {'state': 'completed', 'assets': {'video': 'http://video.url'}}
    fake_get.iter_content = lambda chunk_size: [b'data']
    fake_get.raise_for_status = lambda: None
    monkeypatch.setattr(video.requests, 'get', lambda *a, **k: fake_get)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video, 'process_video', lambda *a, **k: 'processed.mp4')
    monkeypatch.setattr(video, 'process_thumbnail', lambda *a, **k: 'thumb.png')
    result = video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert result == ('file.mp4', 'thumb.png')
    mock_logger.info.assert_called()

def test_generate_video_api_error(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 500
    fake_post.text = 'fail'
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    with pytest.raises(Exception):
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger) 

def test_generate_video_missing_video_url(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.return_value = {'id': 'genid'}
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    fake_get = mock.Mock()
    fake_get.status_code = 200
    fake_get.json.return_value = {'state': 'completed', 'assets': {}}
    fake_get.iter_content = lambda chunk_size: [b'data']
    fake_get.raise_for_status = lambda: None
    monkeypatch.setattr(video.requests, 'get', lambda *a, **k: fake_get)
    with pytest.raises(Exception):
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert any('Video URL not found' in str(c[0][0]) for c in mock_logger.error.call_args_list)

def test_generate_video_failed_api(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 500
    fake_post.text = 'fail'
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    with pytest.raises(Exception):
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert any('Luma API error' in str(e) for e in [str(c[0][0]) for c in mock_logger.error.call_args_list] + [str(a) for a in mock_logger.info.call_args_list])

def test_generate_video_fallback(monkeypatch, mock_config, mock_logger):
    # luma_extend False, no ***** in prompt
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.return_value = {'id': 'genid'}
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    fake_get = mock.Mock()
    fake_get.status_code = 200
    fake_get.json.return_value = {'state': 'completed', 'assets': {'video': 'http://video.url'}}
    fake_get.iter_content = lambda chunk_size: [b'data']
    fake_get.raise_for_status = lambda: None
    monkeypatch.setattr(video.requests, 'get', lambda *a, **k: fake_get)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video, 'process_video', lambda *a, **k: 'processed.mp4')
    monkeypatch.setattr(video, 'process_thumbnail', lambda *a, **k: 'thumb.png')
    # Should not raise
    result = video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert result == ('file.mp4', 'thumb.png')

def test_generate_video_error_no_logger(monkeypatch, mock_config):
    fake_post = mock.Mock()
    fake_post.status_code = 500
    fake_post.text = 'fail'
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    with pytest.raises(Exception):
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=None) 

def test_generate_video_luma_extend(monkeypatch, mock_config, mock_logger):
    # Patch requests.post and requests.get for both initial and extension
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.side_effect = [
        {'id': 'genid'},  # initial
        {'id': 'extendid'}  # extension
    ]
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    # poll_for_completion returns a video_url for both
    def fake_get(*a, **k):
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'state': 'completed', 'assets': {'video': 'http://video.url'}}
        resp.iter_content = lambda chunk_size: [b'data']
        resp.raise_for_status = lambda: None
        return resp
    monkeypatch.setattr(video.requests, 'get', fake_get)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video, 'process_video', lambda *a, **k: 'processed.mp4')
    monkeypatch.setattr(video, 'process_thumbnail', lambda *a, **k: 'thumb.png')
    result = video.generate_video('prompt ***** extension', filename='file.mp4', luma_extend=True, logger=mock_logger)
    assert result == ('file.mp4', 'thumb.png')

def test_generate_video_poll_for_completion_failed(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.return_value = {'id': 'genid'}
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    def fake_get(*a, **k):
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'state': 'failed', 'failure_reason': 'bad'}
        return resp
    monkeypatch.setattr(video.requests, 'get', fake_get)
    with pytest.raises(Exception) as exc:
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert 'Video generation failed' in str(exc.value)

def test_generate_video_poll_for_completion_error(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.return_value = {'id': 'genid'}
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    def fake_get(*a, **k):
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'state': 'error', 'error': 'api error'}
        return resp
    monkeypatch.setattr(video.requests, 'get', fake_get)
    with pytest.raises(Exception) as exc:
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert 'Video generation failed' in str(exc.value)

def test_generate_video_poll_for_completion_timeout(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.return_value = {'id': 'genid'}
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    # Always return running state
    def fake_get(*a, **k):
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'state': 'running'}
        return resp
    monkeypatch.setattr(video.requests, 'get', fake_get)
    # Patch get_config to set max_attempts=1 for quick timeout
    monkeypatch.setattr(video, 'get_config', lambda: {
        'LUMA_GENERATIONS_ENDPOINT': 'http://fake/api',
        'LUMALABS_API_KEY': 'fake-key',
        'LUMA_MODEL': 'model',
        'LUMA_RESOLUTION': 'res',
        'LUMA_DURATION': 1,
        'LUMA_ASPECT_RATIO': '1:1',
        'LUMA_MAX_POLL_ATTEMPTS': 1,
        'LUMA_POLL_INTERVAL': 0.01,
        'LUMA_API_URL': 'http://fake/api',
        'VIDEOS_DIR': '/tmp',
    })
    with pytest.raises(Exception) as exc:
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    assert 'Timed out waiting for video generation' in str(exc.value)

def test_generate_video_missing_extend_id(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.side_effect = [
        {'id': 'genid'},  # initial
        {}  # extension missing id
    ]
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    def fake_get(*a, **k):
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'state': 'completed', 'assets': {'video': 'http://video.url'}}
        resp.iter_content = lambda chunk_size: [b'data']
        resp.raise_for_status = lambda: None
        return resp
    monkeypatch.setattr(video.requests, 'get', fake_get)
    monkeypatch.setattr(video.os, 'makedirs', lambda d, exist_ok: None)
    monkeypatch.setattr(video, 'process_video', lambda *a, **k: 'processed.mp4')
    monkeypatch.setattr(video, 'process_thumbnail', lambda *a, **k: 'thumb.png')
    with pytest.raises(Exception) as exc:
        video.generate_video('prompt ***** extension', filename='file.mp4', luma_extend=True, logger=mock_logger)
    assert 'Failed to get extend generation ID' in str(exc.value)

def test_generate_video_missing_video_url_extension(monkeypatch, mock_config, mock_logger):
    fake_post = mock.Mock()
    fake_post.status_code = 200
    fake_post.json.side_effect = [
        {'id': 'genid'},  # initial
        {'id': 'extendid'}  # extension
    ]
    monkeypatch.setattr(video.requests, 'post', lambda *a, **k: fake_post)
    # poll_for_completion returns no video_url for extension
    def fake_get(*a, **k):
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'state': 'completed', 'assets': {}}
        return resp
    monkeypatch.setattr(video.requests, 'get', fake_get)
    with pytest.raises(Exception) as exc:
        video.generate_video('prompt ***** extension', filename='file.mp4', luma_extend=True, logger=mock_logger)
    assert 'Video URL not found' in str(exc.value)

def test_generate_video_outer_exception(monkeypatch, mock_config, mock_logger):
    def raise_exc(*a, **k): raise Exception('outer fail')
    monkeypatch.setattr(video.requests, 'post', raise_exc)
    with pytest.raises(Exception):
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=mock_logger)
    mock_logger.error.assert_called()

def test_process_video_generic_exception(monkeypatch, mock_config, mock_logger):
    import functions.video as video
    monkeypatch.setattr(video.ffmpeg, 'input', lambda x: x)
    monkeypatch.setattr(video.ffmpeg, 'filter', lambda s, *a, **k: s)
    monkeypatch.setattr(video.ffmpeg, 'output', lambda s, p: (s, p))
    def raise_exc(*a, **k): raise Exception('fail')
    monkeypatch.setattr(video.ffmpeg, 'run', lambda *a, **k: None)
    monkeypatch.setattr(video.shutil, 'move', raise_exc)
    with pytest.raises(Exception):
        video.process_video('input.mp4', logger=mock_logger)
    with pytest.raises(Exception):
        video.process_video('input.mp4', logger=None)

def test_process_thumbnail_generic_exception(monkeypatch, mock_config, mock_logger):
    import functions.video as video
    def raise_exc(*a, **k): raise Exception('fail')
    monkeypatch.setattr(video.ffmpeg, 'probe', raise_exc)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=mock_logger)
    with pytest.raises(Exception):
        video.process_thumbnail('video.mp4', logger=None)

def test_generate_video_outer_exception_no_logger(monkeypatch, mock_config):
    import functions.video as video
    def raise_exc(*a, **k): raise Exception('outer fail')
    monkeypatch.setattr(video.requests, 'post', raise_exc)
    with pytest.raises(Exception):
        video.generate_video('prompt', filename='file.mp4', luma_extend=False, logger=None) 