"""Read JPEG/PNG dimensions using only the Python standard library."""
import struct

def image_size(path):
    with open(path, 'rb') as f:
        signature = f.read(24)
        if signature[:8] == b'\x89PNG\r\n\x1a\n':
            return struct.unpack('>II', signature[16:24])
        if signature[:2] != b'\xff\xd8':
            raise ValueError(f'Unsupported image: {path}')
        f.seek(2)
        while True:
            byte = f.read(1)
            if not byte:
                raise ValueError(f'Invalid JPEG: {path}')
            if byte != b'\xff':
                continue
            marker = f.read(1)
            while marker == b'\xff':
                marker = f.read(1)
            if not marker or marker in (b'\xd9', b'\xda'):
                raise ValueError(f'JPEG has no dimensions: {path}')
            if marker[0] in (0x00, 0x01, *range(0xd0, 0xd9)):
                continue
            length = struct.unpack('>H', f.read(2))[0]
            if marker[0] in (0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf):
                _, height, width = struct.unpack('>BHH', f.read(5))
                return width, height
            f.seek(length - 2, 1)
