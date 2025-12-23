# == Project Infra-Terraform README ==
# 
# Terraform configuration for deploying infrastructure

import os

# Import necessary modules
import logging
from terraform import Terraform

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define Terraform configuration
tf = Terraform(
    provider={
        'name': 'aws',
        'version': '~> 4.13.0'
    },
    backend={
        's3': {
            'bucket': 'my-bucket',
            'key': 'terraform/state',
            'region': 'us-west-2',
            'dynamodb_table': 'terraform-lock'
        }
    },
    modules={
        'path': ['modules']
    }
)

# Define infrastructure resources
resources = [
    {
        'type': 'aws_instance',
        'name': 'my_instance',
        'properties': {
            'ami': 'ami-0c94855ba95c71c99',
            'instance_type': 't2.micro'
        }
    }
]

# Create Terraform configuration object
tf.config(resources=resources)

# Initialize and apply Terraform
tf.init()
tf.apply()

# Print Terraform plan and output
logging.info(tf.plan())
logging.info(tf.output())

# Print Terraform state
logging.info(tf.state())