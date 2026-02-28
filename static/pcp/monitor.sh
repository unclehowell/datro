#!/bin/bash

# Monitoring and health check script for DNS infrastructure

CONTAINERS=("pihole" "bind9" "squid")
SERVICES=("http://localhost/admin" "dns://172.20.0.5:53" "http://localhost:3128")

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_container_health() {
    log "Checking container health..."
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*healthy\|$container.*Up"; then
            log "✓ $container: Running"
        else
            log "✗ $container: Not running or unhealthy"
            return 1
        fi
    done
    return 0
}

check_dns_resolution() {
    log "Testing DNS resolution..."
    
    # Test Pi-hole
    if dig @172.20.0.2 google.com +timeout=1 +tries=1 > /dev/null 2>&1; then
        log "✓ Pi-hole DNS: Working"
    else
        log "✗ Pi-hole DNS: Failed"
        return 1
    fi
    
    # Test Bind9
    if dig @172.20.0.5 google.com +timeout=1 +tries=1 > /dev/null 2>&1; then
        log "✓ Bind9 DNS: Working"
    else
        log "✗ Bind9 DNS: Failed"
        return 1
    fi
    
    # Test reverse lookup
    if dig -x 172.20.0.2 @172.20.0.5 +short +timeout=1 > /dev/null 2>&1; then
        log "✓ Reverse DNS: Working"
    else
        log "✗ Reverse DNS: Issues detected"
    fi
    
    return 0
}

check_proxy() {
    log "Testing Squid proxy..."
    if curl -x localhost:3128 --max-time 5 -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip | grep -q "200"; then
        log "✓ Squid proxy: Working"
        return 0
    else
        log "✗ Squid proxy: Not responding"
        return 1
    fi
}

check_pihole() {
    log "Testing Pi-hole web interface..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/admin | grep -q "200"; then
        log "✓ Pi-hole web interface: Accessible"
        return 0
    else
        log "✗ Pi-hole web interface: Not accessible"
        return 1
    fi
}

check_performance() {
    log "Performance check..."
    
    # DNS query speed test
    dns_time=$(dig google.com +stats | grep "Query time:" | awk '{print $4}')
    if [ -n "$dns_time" ] && [ "$dns_time" -lt 100 ]; then
        log "✓ DNS query speed: ${dns_time}ms (Fast)"
    elif [ -n "$dns_time" ]; then
        log "(!) DNS query speed: ${dns_time}ms (Consider optimization)"
    fi
    
    # Cache hit ratio (if Squid stats available)
    if docker exec squid squidclient -h localhost mgr:info 2>/dev/null | grep -q "Hit Ratios"; then
        cache_hit=$(docker exec squid squidclient -h localhost mgr:info | grep "Hit Ratio" | tail -1 | awk '{print $4}')
        log "✓ Squid cache hit ratio: $cache_hit"
    fi
}

restart_services() {
    log "Attempting to restart services..."
    docker-compose restart
    sleep 10
}

monitor_loop() {
    while true; do
        log "=== Health Check Started ==="
        if check_container_health && check_dns_resolution && check_proxy && check_pihole; then
            check_performance
            log "=== All Services Healthy ==="
        else
            log "=== Issues Detected ==="
            if command -v notify-send &> /dev/null; then
                notify-send "DNS Infrastructure Alert" "Issues detected in DNS services - check logs"
            fi
        fi
        
        # Check every 5 minutes
        sleep 300
    done
}

case "$1" in
    "health")
        check_container_health
        check_dns_resolution
        check_proxy
        check_pihole
        check_performance
        ;;
    "monitor")
        monitor_loop
        ;;
    "restart")
        restart_services
        ;;
    *)
        echo "Usage: $0 [health|monitor|restart]"
        echo "  health  - Run one-time health check"
        echo "  monitor - Continuous monitoring"
        echo "  restart - Restart all services"
        ;;
esac