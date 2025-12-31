#!/bin/bash

# Risk Demo Script
# This script helps demonstrate the Risk RWA Risk Gateway

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Risk RWA Risk Gateway - Demo Script               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if services are running
check_service() {
    local port=$1
    local service=$2
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service is running on port $port${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $service is not running on port $port${NC}"
        return 1
    fi
}

echo -e "${BLUE}📋 Checking Services...${NC}"
API_RUNNING=false
FRONTEND_RUNNING=false

if check_service 3000 "API Server"; then
    API_RUNNING=true
fi

if check_service 5173 "Frontend"; then
    FRONTEND_RUNNING=true
fi

echo ""

# Demo scenarios
show_demo_menu() {
    echo -e "${BLUE}🎯 Demo Scenarios:${NC}"
    echo ""
    echo "1. Quick Demo (Frontend only - Mock Data)"
    echo "2. Full Stack Demo (API + Frontend)"
    echo "3. API Endpoint Demo (curl commands)"
    echo "4. Wallet Integration Demo"
    echo "5. Start All Services"
    echo "6. Stop All Services"
    echo "7. Exit"
    echo ""
    read -p "Select option (1-7): " choice
}

start_services() {
    echo -e "${BLUE}🚀 Starting Services...${NC}"
    
    if [ "$API_RUNNING" = false ]; then
        echo "Starting API server..."
        cd api && npm run dev > /tmp/pulsar-api.log 2>&1 &
        API_PID=$!
        echo "API server starting (PID: $API_PID)"
        sleep 3
    fi
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo "Starting frontend..."
        cd ../frontend && npm run dev > /tmp/pulsar-frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo "Frontend starting (PID: $FRONTEND_PID)"
        sleep 3
    fi
    
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo "API: http://localhost:3000"
    echo "Frontend: http://localhost:5173"
}

stop_services() {
    echo -e "${YELLOW}🛑 Stopping Services...${NC}"
    
    if lsof -ti:3000 > /dev/null 2>&1; then
        kill $(lsof -ti:3000) 2>/dev/null || true
        echo "API server stopped"
    fi
    
    if lsof -ti:5173 > /dev/null 2>&1; then
        kill $(lsof -ti:5173) 2>/dev/null || true
        echo "Frontend stopped"
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

demo_frontend_only() {
    echo -e "${BLUE}🎨 Frontend-Only Demo (Mock Data)${NC}"
    echo ""
    echo "This demo shows the frontend with mock data (no API server needed)"
    echo ""
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo "Starting frontend..."
        cd frontend && npm run dev > /tmp/pulsar-frontend.log 2>&1 &
        sleep 5
    fi
    
    echo -e "${GREEN}✅ Frontend is ready!${NC}"
    echo ""
    echo "📱 Open in browser: http://localhost:5173"
    echo ""
    echo "Demo Steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. The frontend will automatically use mock data"
    echo "3. Try entering different token mint addresses"
    echo "4. Switch between 'RWA Risk Metrics' and 'Liquidation Parameters'"
    echo "5. (Optional) Connect a Solana wallet (Phantom/Solflare)"
    echo ""
    echo "Press Enter to continue..."
    read
}

demo_full_stack() {
    echo -e "${BLUE}🔗 Full Stack Demo${NC}"
    echo ""
    
    start_services
    
    echo ""
    echo -e "${GREEN}✅ Full stack is ready!${NC}"
    echo ""
    echo "📱 Frontend: http://localhost:5173"
    echo "🔌 API: http://localhost:3000"
    echo ""
    echo "Demo Steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. The frontend will connect to the API server"
    echo "3. Enter a token mint address (e.g., USDC)"
    echo "4. View RWA risk data from the API"
    echo "5. Switch endpoints to see different data"
    echo "6. Check API logs: tail -f /tmp/pulsar-api.log"
    echo ""
    echo "Press Enter to continue..."
    read
}

demo_api_endpoints() {
    echo -e "${BLUE}🔌 API Endpoint Demo${NC}"
    echo ""
    
    if [ "$API_RUNNING" = false ]; then
        echo "Starting API server..."
        cd api && npm run dev > /tmp/pulsar-api.log 2>&1 &
        sleep 3
    fi
    
    echo "Testing API endpoints..."
    echo ""
    
    echo -e "${YELLOW}1. Health Check:${NC}"
    curl -s http://localhost:3000/health | jq '.' || echo "Health check failed"
    echo ""
    
    echo -e "${YELLOW}2. Payment Quote (Default):${NC}"
    curl -s "http://localhost:3000/api/v1/payment/quote" | jq '.' || echo "Quote request failed"
    echo ""
    
    echo -e "${YELLOW}3. Payment Quote (RWA Risk):${NC}"
    curl -s "http://localhost:3000/api/v1/payment/quote?endpoint=rwa-risk" | jq '.' || echo "Quote request failed"
    echo ""
    
    echo -e "${YELLOW}4. RWA Risk Data (Demo Mode):${NC}"
    curl -s -H "x-demo-mode: true" \
        "http://localhost:3000/api/v1/data/rwa-risk/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" | jq '.' || echo "Data request failed"
    echo ""
    
    echo -e "${YELLOW}5. Liquidation Parameters (Demo Mode):${NC}"
    curl -s -H "x-demo-mode: true" \
        "http://localhost:3000/api/v1/data/liquidation-params/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" | jq '.' || echo "Data request failed"
    echo ""
    
    echo -e "${GREEN}✅ API demo complete!${NC}"
    echo ""
    echo "Press Enter to continue..."
    read
}

demo_wallet_integration() {
    echo -e "${BLUE}👛 Wallet Integration Demo${NC}"
    echo ""
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo "Starting frontend..."
        cd frontend && npm run dev > /tmp/pulsar-frontend.log 2>&1 &
        sleep 5
    fi
    
    echo -e "${GREEN}✅ Frontend is ready!${NC}"
    echo ""
    echo "📱 Open in browser: http://localhost:5173"
    echo ""
    echo "Wallet Integration Steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Click 'Select Wallet' button in the top right"
    echo "3. Choose Phantom or Solflare wallet"
    echo "4. Approve the connection in your wallet"
    echo "5. Your wallet address will appear in the header"
    echo "6. The frontend will use your wallet for authenticated requests"
    echo ""
    echo "Note: Make sure your wallet is set to Devnet for testing"
    echo ""
    echo "Press Enter to continue..."
    read
}

# Main loop
while true; do
    echo ""
    show_demo_menu
    
    case $choice in
        1)
            demo_frontend_only
            ;;
        2)
            demo_full_stack
            ;;
        3)
            demo_api_endpoints
            ;;
        4)
            demo_wallet_integration
            ;;
        5)
            start_services
            ;;
        6)
            stop_services
            ;;
        7)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid option. Please select 1-7.${NC}"
            ;;
    esac
done

