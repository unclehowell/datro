# AWS CLI

## Installation
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
```

## Configuration
AWS credentials stored locally in `~/.aws/`:
- `credentials` - Access keys (DO NOT commit to git)
- `config` - Region and profile settings

## Usage
```bash
# Using a named profile
aws ec2 describe-instances --profile YOUR_PROFILE_NAME

# Using default profile
aws ec2 describe-instances

# List running instances
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query "Reservations[].Instances[].{IP:PublicIpAddress,ID:InstanceId}"
```

## Key Instances
- **Main Server**: 13.135.142.244 (command.financecheque.uk)
- Key pair: `paperclip-hermes-nvidia-key.pem` (in ~/.ssh/)

## SSH to AWS
```bash
ssh -i ~/.ssh/paperclip-hermes-nvidia-key.pem ubuntu@13.135.142.244
```

## Common AWS Tasks
```bash
# List running instances
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"

# Get instance details
aws ec2 describe-instances --instance-ids i-0722156c17f1c74d2
```

## Environment Variables (stored LOCALLY, NOT in brain)
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_PROFILE

## References
- Credentials: ~/.aws/credentials (profile: amelia, default)
- SSH Key: ~/.ssh/paperclip-hermes-nvidia-key.pem
- Region: eu-west-2
