#!/usr/bin/env python3
"""
Eureka 落地页 EdgeOne Pages 部署脚本
使用腾讯云 API 直接部署
"""

import json
import os
import sys
import hashlib
import hmac
import base64
import datetime
import urllib.request
import urllib.parse
import urllib.error

# 腾讯云 API 配置
SERVICE = "edgeone"
HOST = "edgeone.tencentcloudapi.com"
REGION = "ap-guangzhou"
VERSION = "2022-09-01"
ACTION = "CreateDeployVersion"

def get_signature(secret_key, date, service, string_to_sign):
    """生成腾讯云 API 签名"""
    date_key = hmac.new(f"TC3{secret_key}".encode(), date.encode(), hashlib.sha256).digest()
    service_key = hmac.new(date_key, service.encode(), hashlib.sha256).digest()
    signing_key = hmac.new(service_key, "tc3_request".encode(), hashlib.sha256).digest()
    signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()
    return signature

def deploy_to_edgeone(secret_id, secret_key, project_name, zip_file_path):
    """部署到 EdgeOne Pages"""
    
    # 读取 zip 文件
    with open(zip_file_path, 'rb') as f:
        zip_content = f.read()
    
    # 当前时间
    now = datetime.datetime.utcnow()
    date = now.strftime("%Y-%m-%d")
    timestamp = str(int(now.timestamp()))
    
    # 请求体
    payload = {
        "ZoneId": "",  # 可选
        "ProjectName": project_name,
        "FileName": os.path.basename(zip_file_path),
        "FileContent": base64.b64encode(zip_content).decode(),
        "Description": f"Eureka Landing Page - {datetime.datetime.now().isoformat()}"
    }
    
    payload_json = json.dumps(payload)
    payload_bytes = payload_json.encode()
    
    # 计算哈希
    payload_hash = hashlib.sha256(payload_bytes).hexdigest()
    
    # 规范请求
    canonical_request = f"POST\n/\n\ncontent-type:application/json\nhost:{HOST}\nx-tc-action:{ACTION.lower()}\n\ncontent-type;host;x-tc-action\n{payload_hash}"
    
    # 签名字符串
    credential_scope = f"{date}/{SERVICE}/tc3_request"
    string_to_sign = f"TC3-HMAC-SHA256\n{timestamp}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode()).hexdigest()}"
    
    # 签名
    signature = get_signature(secret_key, date, SERVICE, string_to_sign)
    
    # 授权头
    authorization = f"TC3-HMAC-SHA256 Credential={secret_id}/{credential_scope}, SignedHeaders=content-type;host;x-tc-action, Signature={signature}"
    
    # 请求头
    headers = {
        "Content-Type": "application/json",
        "Host": HOST,
        "X-TC-Action": ACTION,
        "X-TC-Version": VERSION,
        "X-TC-Timestamp": timestamp,
        "X-TC-Region": REGION,
        "Authorization": authorization
    }
    
    # 发送请求
    req = urllib.request.Request(
        f"https://{HOST}",
        data=payload_bytes,
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode())
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"HTTP Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # 从环境变量获取凭证
    secret_id = os.environ.get("TENCENTCLOUD_SECRET_ID")
    secret_key = os.environ.get("TENCENTCLOUD_SECRET_KEY")
    
    if not secret_id or not secret_key:
        print("错误：请设置 TENCENTCLOUD_SECRET_ID 和 TENCENTCLOUD_SECRET_KEY 环境变量")
        sys.exit(1)
    
    project_name = "eureka-landing"
    zip_file = "eureka-landing-page.zip"
    
    print(f"正在部署 {project_name} 到 EdgeOne Pages...")
    result = deploy_to_edgeone(secret_id, secret_key, project_name, zip_file)
    
    if result:
        print("部署结果:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("部署失败")
        sys.exit(1)
